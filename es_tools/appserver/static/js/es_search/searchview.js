require.config({
    paths: {
        es: "../app/Clay/js/es_search",
        text: "../app/Clay/lib/text"
    }
})

define(["jquery",
    "underscore",
    "backbone",
    "es/eventview",
    "es/fieldview",
    "es/modalview",
    "es/queryexec",
    "es/utils",
    "splunkjs/mvc/searchmanager",
    "splunkjs/mvc/chartview"
], function ($,
    _,
    Backbone,
    EventView,
    FieldView,
    ModalView,
    queryExec,
    utils,
    SearchManager,
    ChartView) {

        return Backbone.View.extend({

            bShowFields: true,
            qeditor: null,
            eventview: null,
            trview: null,
            tlsearch: null,
            timechart: null,

            "initialize": function (options) {
                var vm = this
                Backbone.Events.on('all', function (e) {
                    if (vm.events[e]) {
                        vm.events[e].apply(vm, Array.prototype.slice.call(arguments, 1));
                    }
                })
            },
            "events": {
                "query:start": function () {
                    this.executeQuery(1, true)
                },
                "query:page": function (page_number) {
                    this.executeQuery(page_number)
                },
                "eventview:rendered": function () {
                    this.fieldview.render()
                    this.printMessage('')
                },
                "fieldview:ready": function (aggregations_objects) {
                    this.startSearch(aggregations_objects)
                },
                "eventview:empty": function (message) {
                    this.tlsearch.cancel()
                    this.timechart.$el.hide()
                    this.printMessage(message)
                },
                "timerange:update": function (new_timerange) {
                    console.log('timerange:update', new_timerange)
                }
            },
            "render": function () {
                var vm = this

                vm.tlsearch = new SearchManager({
                    id: "timeline-search",
                    preview: true,
                    status_buckets: 300,
                    autostart: true,
                    cache: false
                })

                vm.timechart = new ChartView({
                    id: "example-chart",
                    managerid: "timeline-search",
                    type: "column",
                    "height": 160,
                    "charting.legend.placement": "none",
                    "charting.seriesColors": "[0x65a637]",
                    "charting.axisTitleX.visibility": "collapsed",
                    "charting.axisTitleY.visibility": "collapsed",
                    "charting.axisTitleY2.visibility": "visible",
                    "charting.axisLabelsY2.axisVisibility": "show",
                    "charting.chart.columnSpacing": "0",
                    "charting.chart.seriesSpacing": "0",
                    "refresh.auto.interval": "5",
                    el: $(".timechart-content")
                }).render()

                vm.trview.on("change", function (e) {
                    console.log('timerange change', e, vm.trview)
                    vm.updateTimerange()
                    vm.executeQuery(1, true)
                })

                vm.tlsearch.on('search:done', function (e) {
                    if (e.content.resultCount > 0) {
                        vm.timechart.$el.show()
                    } else {
                        vm.timechart.$el.hide()
                    }
                })

                vm.tlsearch.on('search:start', function (e) {
                    // timechart.$el.show()
                })

                vm.timechart.on('selection', function (e) {
                    if (e.data && e.data.start) {
                        var start_time = utils.unix(e.data.start)
                        var end_time = utils.unix(e.data.end)
                        var qo = $.extend(true, {}, vm.tlsearch.qo)
                        if (!e.isReset) {
                            // 시간 간격 업데이트
                        }
                        //fetchEvents(qo)
                    }
                })

                vm.timechart.on('clicked:chart', function (e) {
                    e.preventDefault()
                    console.log('timechart click', e, e.value)
                })
            },
            "fetchEvents": function (qo) {
                var vm = this
                queryExec.hitsQuery(qo).done(function (res) {
                    res.hits.from = qo.from
                    if (res.aggregations) {
                        vm.fieldview.aggs = res.aggregations
                    }
                    vm.timechart.$el.show()
                    vm.eventview.render(res.hits, vm.bShowFields)
                    vm.setTimeoutQuery()
                }).fail(function (e, res) {
                    // console.log('hitsQuery', e, res)
                    vm.printMessage(e)
                })
            },
            "executeQuery": function (pageNum, bRestore) {
                var vm = this
                if (bRestore) {
                    // 신규 검색
                    if (vm.eventview) {
                        vm.eventview.close()
                    }
                    vm.timechart.$el.hide()
                    vm.updateEventCount(0)
                    vm.printMessage('No results yet found.', 'info')
                } else {
                    // pagination query
                    vm.printMessage()
                }

                if (!vm.makeQueryObject(pageNum, bRestore)) {
                    return
                }

                if (bRestore) {
                    var qo = $.extend(true, {}, vm.tlsearch.qo);
                    queryExec.fieldsQuery(qo).done(function (res) {
                        vm.fieldview = new FieldView({
                            "mappings": res,
                            "el": ".search-results-eventspane-fieldsviewer",
                            "maxFields": 12
                        })
                        vm.eventview = new EventView({
                            "el": $('.search-results-eventspane-controls'),
                            "onShowFields": function (bShow) {
                                vm.bShowFields = bShow
                            }
                        })
                    })
                } else {
                    var qo = $.extend(true, {}, vm.tlsearch.qo);
                    vm.fetchEvents(qo)
                }
            },
            "startSearch": function (aggregations_objects) {
                var vm = this
                var qo = $.extend(true, {}, vm.tlsearch.qo);
                qo.json = _.extend(qo.json, {
                    "aggs": aggregations_objects
                })
                qo.data = JSON.stringify(qo.json)

                var qdata = JSON.stringify(qo.tlq)
                qdata = qdata.replace(/"/g, '\\"')
                eshost = this._esHost
                eshost = eshost + '/' + qo.index + '/_search'
                vm.tlsearch.set({
                    search: ' | estimeline "' + eshost + '" "' + qdata + '" \
                    | eval _time = strptime(key_as_string,"%Y-%m-%dT%H:%M:%S")\
                    | rename doc_count as count \
                    | table _time, count'
                })

                vm.fetchEvents(qo)
                vm.tlsearch.startSearch()
            },
            "updateEventCount": function (count) {
                $('#tab_events').text(' Events (' + count + ')')
            },
            "showMessage": function (title, message) {
                var modal = new ModalView({
                    title: title,
                    message: message
                })
                modal.show()
            },
            "printMessage": function (message, type) {
                console.log('printMessage', message)
                var html = ''
                var $msg = $('.message-single.search-results-shared-jobdispatchstatemessage')
                if (message) {
                    if (_.isObject(message)) {
                        message = JSON.stringify(message)
                    }
                    if (type === 'info') {
                        html = '<div class="alert alert-info"><i class="icon-alert"></i>' + message + '</div>'
                    } else {
                        html = '<div class="alert alert-error"><i class="icon-alert"></i>' + message + '</div>'
                    }
                    $msg.show()
                } else {
                    $msg.hide()
                }
                $msg.html(html)
            },
            "getTimeout": function (isRuntime, gte) {
                if (isRuntime) {
                    var m = gte.match(/rt-(\d+)([smh])$/)
                    if (!m) {
                        //
                        console.log('timerange.timeout=', m, gte)
                    } else {
                        var num = parseInt(m[1], 10)
                        return num * this.trview.runtimeMod[m[2]]
                    }
                }
                return 0
            },
            "setTimeoutQuery": function () {
                if (this.trview.timerange.timeout) {
                    if (this.trview.runtimeId) {
                        //cancelTimeout(trview.runtimeId)
                    }
                    this.trview.runtimeId = setTimeout(function () {
                        updateTimerange()
                        executeQuery(1, true)
                    }, this.trview.timerange.timeout)
                }
            },
            "updateTimerange": function () {
                var mtr = this.trview
                var gte = mtr.val().earliest_time
                var lte = mtr.val().latest_time

                mtr.timerange.earliest_time = gte
                mtr.timerange.latest_time = lte
                mtr.timerange.isRuntime = (gte && !_.isNumber(gte) && gte.indexOf('rt') === 0)

                if (gte === 'rt' && lte === 'rt') {
                    // runtime
                    mtr.timerange.gte = 0
                    mtr.timerange.lte = ''
                } else if (gte === 0 && lte === '') {
                    // All time, not runtime
                    mtr.timerange.gte = 0
                    mtr.timerange.lte = ''
                } else {
                    mtr.timerange.gte = utils.spModify(gte)
                    mtr.timerange.lte = utils.spModify(lte)
                }

                mtr.timerange.timeout = this.getTimeout(mtr.timerange.isRuntime, gte)
            },
            "makeQueryObject": function (pageNum, bRestore) {
                if (!bRestore) {
                    this.tlsearch.qo = queryExec.applyPagination(this.tlsearch.qo, pageNum)
                    return true
                }

                var qo = queryExec.createQuery(this.qeditor.getValue())

                if (!qo) {
                    return false
                }
                if (qo.method !== 'GET') {
                    showMessage('잘 못된 쿼리문장', '검색문장은 GET으로 시작하여야 합니다.')
                    return false
                }
                if (qo.uri.indexOf('_search') < 0) {
                    showMessage('잘 못된 쿼리문장', '_search 키워드를 사용해 주세요.')
                    return false
                }
                if (!qo.json) {
                    showMessage('잘 못된 쿼리문장', '문장을 확인해 주세요.')
                    return false
                }

                qo.size = 10
                qo.bShowField = this.bShowFields
                qo = queryExec.applyTimeRange(qo, this.trview.timerange)
                qo = queryExec.applyPagination(qo, pageNum)

                tlq = {
                    "size": 0,
                    "aggs": {
                        "count_by_timestamp": {
                            "date_histogram": {
                                "field": "@timestamp",
                                "interval": utils.timelineInterval(qo.json)
                            }
                        }
                    },
                    "query": {},
                    "sort": [{
                        "@timestamp": {
                            "order": "desc"
                        }
                    }]
                }
                $.extend(true, tlq.query, qo.json.query)
                // $.extend(true, tlq.sort, queryObject.json.sort)
                qo.tlq = tlq

                this.tlsearch.qo = qo

                return true
            }
        })

    })