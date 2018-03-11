require.config({
    paths: {
        es: "../app/Clay/js/es_search",
        text: "../app/Clay/lib/text"
    }
})

define(["jquery",
    "backbone",
    "moment",
    "es/eventview",
    "es/fieldview",
    "es/modalview",
    "es/queryeditor",
    "es/queryexec",
    "es/datetimeModifier",
    "ace/ace",
    "text!../app/Clay/html/es_search.html",
    "splunkjs/mvc/timerangeview",
    "splunkjs/mvc/searchmanager",
    "splunkjs/mvc/chartview"
], function ($,
    Backbone,
    moment,
    EventView,
    FieldView,
    ModalView,
    QueryEditor,
    queryExec,
    datemod,
    ace,
    es_search,
    TimeRangeView,
    SearchManager,
    ChartView) {

        return Backbone.View.extend({

            bShowFields: true,
            queryObject: {},

            qeditor: null,
            eventview: null,
            trview: null,
            tlsearch: null,
            timechart: null,


            "initialize": function (options) {
                var vm = this
                $.get('/custom/Clay/estools/get_eshost').done(function (res) {
                    vm._esHost = res.host
                    vm.executeQuery(1, true)
                })

                Backbone.Events.on('all', function (e) {
                    if (vm.events[e]) {
                        vm.events[e].apply(vm, Array.prototype.slice.call(arguments, 1));
                    } else {
                        console.log('event', e)
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
                    fieldview.render()
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

                $('.dashboard-title').prepend('<i class="icon-search-thin"></i> ')
                $('.dashboard-body').css('min-height', 0)
                $('.dashboard-body').css('padding', '0 20px')
                $(es_search).insertAfter(vm.$el)

                vm.qeditor = new QueryEditor({
                    el: $('.search-bar-wrapper.shared-searchbar')
                })

                vm.trview = new TimeRangeView({
                    id: "example-timerange",
                    "managerid": "example-search",
                    preset: "Today",
                    el: $(".search-timerange")
                }).render()

                vm.trview.timerange = {
                    runtime: false,
                    gte: moment().utc().format('YYYY-MM-DDT00:00:00.000+00:00'),
                    lte: moment().utc().format('YYYY-MM-DDThh:mm:ss.000+00:00'),
                    timezone: "+09:00"
                }

                vm.trview.runtimeMod = {
                    "s": 1000,
                    "m": 60000,
                    "h": 3600000
                }

                vm.trview.on("change", function (e) {
                    console.log('timerange change', e)
                    vm.updateTimerange()
                    vm.executeQuery(1, true)
                })

                vm.tlsearch = new SearchManager({
                    id: "timeline-search",
                    preview: true,
                    status_buckets: 300,
                    autostart: true,
                    cache: false
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

                vm.timechart.on('selection', function (e) {
                    if (e.data && e.data.start) {
                        var start_time = moment(e.data.start * 1000).format()
                        var end_time = moment(e.data.end * 1000).format()
                        console.log('timechart selection', e, start_time, end_time, vm.trview.timerange)
                    }
                })

                vm.timechart.on('clicked:chart', function (e) {
                    e.preventDefault()
                    console.log('timechart click', e, e.value)
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
                    var qo = $.extend(true, {}, queryObject);
                    queryExec.fieldsQuery(qo).done(function (res) {
                        console.log('field query completed.')
                        fieldview = new FieldView({
                            "mappings": res,
                            "el": ".search-results-eventspane-fieldsviewer",
                            "maxFields": 12
                        })
                        eventview = new EventView({
                            "el": $('.search-results-eventspane-controls'),
                            "onShowFields": function (bShow) {
                                vm.bShowFields = bShow
                            }
                        })
                    })
                } else {
                    var qo = $.extend(true, {}, queryObject);
                    queryExec.hitsQuery(qo).done(function (res) {
                        res.hits.from = qo.from
                        eventview.render(res.hits, vm.bShowFields)
                        fieldview.render()
                    })
                }
            },
            "startSearch": function (aggregations_objects) {
                var vm = this
                var qo = $.extend(true, {}, queryObject);
                qo.json = _.extend(qo.json, {
                    "aggs": aggregations_objects
                })
                qo.data = JSON.stringify(qo.json)
                queryExec.hitsQuery(qo).done(function (res) {
                    res.hits.from = qo.from
                    fieldview.aggs = res.aggregations
                    vm.timechart.$el.show()
                    eventview.render(res.hits, vm.bShowFields)
                    vm.setTimeoutQuery()
                }).fail(function (e, res) {
                    // console.log('hitsQuery', e, res)
                    vm.printMessage(e)
                })
                qdata = JSON.stringify(queryObject.tlq)
                qdata = qdata.replace(/"/g, '\\"')
                eshost = this._esHost
                console.log('queryObject', queryObject)
                eshost = eshost + '/' + queryObject.index + '/_search'
                vm.tlsearch.set({
                    search: ' | estimeline "' + eshost + '" "' + qdata + '" \
                    | eval _time = strptime(key_as_string,"%Y-%m-%dT%H:%M:%S")\
                    | rename doc_count as count \
                    | table _time, count'
                })
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
                var html = ''
                var $msg = $('.message-single.search-results-shared-jobdispatchstatemessage')
                if (message) {
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
                        return num * trview.runtimeMod[m[2]]
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
                    mtr.timerange.gte = datemod.convertToUTC(gte)
                    mtr.timerange.lte = datemod.convertToUTC(lte)
                }

                mtr.timerange.timeout = this.getTimeout(mtr.timerange.isRuntime, gte)
            },
            "makeQueryObject": function (pageNum, bRestore) {
                if (!bRestore) {
                    queryObject = queryExec.applyPagination(queryObject, pageNum)
                    return true
                }

                queryObject = queryExec.getQueryObject(this.qeditor.getValue())

                if (!queryObject) {
                    return false
                }
                if (queryObject.method !== 'GET') {
                    showMessage('잘 못된 쿼리문장', '검색문장은 GET으로 시작하여야 합니다.')
                    return false
                }
                if (queryObject.uri.indexOf('_search') < 0) {
                    showMessage('잘 못된 쿼리문장', '_search 키워드를 사용해 주세요.')
                    return false
                }
                if (!queryObject.json) {
                    showMessage('잘 못된 쿼리문장', '문장을 확인해 주세요.')
                    return false
                }

                queryObject.size = 10
                queryObject.bShowField = this.bShowFields
                queryObject = queryExec.applyTimeRange(queryObject, this.trview.timerange)
                queryObject = queryExec.applyPagination(queryObject, pageNum)

                tlq = {
                    "size": 0,
                    "aggs": {
                        "count_by_timestamp": {
                            "date_histogram": {
                                "field": "@timestamp",
                                "interval": "1d"
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
                $.extend(true, tlq.query, queryObject.json.query)
                // $.extend(true, tlq.sort, queryObject.json.sort)
                queryObject.tlq = tlq

                return true
            }
        })

    })