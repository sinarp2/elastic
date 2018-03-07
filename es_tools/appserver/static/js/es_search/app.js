require.config({
    paths: {
        es: "../app/Clay/js/es_search",
        ace: "../app/Clay/js/ace",
        text: "../app/Clay/lib/text"
    }
})

require([
    "jquery",
    "backbone",
    "moment",
    "es/eventview",
    "es/modalview",
    "es/queryeditor",
    "es/queryexec",
    "es/datetimeModifier",
    "ace/ace",
    "text!../app/Clay/html/es_search.html",
    "splunkjs/mvc/timerangeview",
    "splunkjs/mvc/searchmanager",
    "splunkjs/mvc/timelineview",
    'splunkjs/mvc/simplexml/ready!'
], function (
    $,
    Backbone,
    moment,
    EventView,
    ModalView,
    QueryEditor,
    QueryExec,
    DatetimeModifier,
    ace,
    es_search,
    TimeRangeView,
    SearchManager,
    TimelineView
) {
        $('.dashboard-title').prepend('<i class="icon-search-thin"></i> ')
        $('.dashboard-body').css('min-height', 0)
        $('.dashboard-body').css('padding', '0 20px')
        $(es_search).insertAfter($('.dashboard-body'))

        var bShowFields = true

        var modifier = new DatetimeModifier()

        var queryEditor = new QueryEditor({
            el: $('.search-bar-wrapper.shared-searchbar')
        })

        /*
        * EventView
        */
        var eventview = new EventView({
            el: $('.search-results-eventspane-controls'),
            "onShowFields": function (bShow) {
                bShowFields = bShow
            }
        })

        /*
        * TimeRangeView
        */
        var mytimerange = new TimeRangeView({
            id: "example-timerange",
            "managerid": "example-search",
            preset: "Today",
            el: $(".search-timerange")
        }).render()

        mytimerange.timerange = {
            runtime: false,
            gte: moment().utc().format('YYYY-MM-DDT00:00:00.000+00:00'),
            lte: moment().utc().format('YYYY-MM-DDThh:mm:ss.000+00:00')
        }

        mytimerange.runtimeMod = {
            "s": 1000,
            "m": 60000,
            "h": 3600000
        }

        mytimerange.on("change", function (e) {
            setTimerange()
            executeQuery(1, true)
        })
        
        /*
        * SearchManager
        */
        var mysearch = new SearchManager({
            id: "example-search",
            preview: true,
            search: ' | esproxy "http://211.234.125.15:29200/dhcp*/_search" "{ \\"size\\":20, \\"query\\": { \\"match_all\\" : {} } }" ',
            status_buckets: 300,
            required_field_list: "*"
        })

        mysearch.on('search:done', function (e) {
            console.log('search done', e)
            console.log('data', mysearch.get("data"))
            console.log('job', mysearch.getJobResponse())
        })

        var mytimeline = new TimelineView({
            id: "example-timeline",
            managerid: "example-search",
            el: $(".timeline-container")
        }).render()

        mytimeline.on("change", function(e) {
            console.log('mytimeline changed', e, mytimeline.val())
            // mysearch.search.set(mytimeline.val());
        })

        // var listviewer = new EventsViewer({
        //     id: "example-eventsviewer-list",
        //     managerid: "example-search",
        //     type: "raw",
        //     pagerPosition: "top",
        //     showPager: true,
        //     rowNumbers: false,
        //     el: $(".search-results-eventspane-controls")
        // }).render()


        function executeQuery(pageNum, bRestore) {
            // 신규 검색
            // 필드 목록 추출
            if (bRestore) {
                updateEventCount(0)
                printMessage('No results yet found.', 'info')
                if (mytimerange.timerange.timeout) {
                    console.log('timeout check', mytimerange.timerange.timeout)
                    if (mytimerange.runtimeId) {
                        //cancelTimeout(mytimerange.runtimeId)
                    }
                    mytimerange.runtimeId = setTimeout(function() {
                        setTimerange()
                        executeQuery(1, true)
                    }, mytimerange.timerange.timeout)
                }
            } else {
                printMessage()
            }

            var qo = QueryExec.tokenizeQuery(queryEditor.getValue())
            if (!qo) {
                return
            }
            if (qo.method !== 'GET') {
                showMessage('잘 못된 쿼리문장', '검색문장은 GET으로 시작하여야 합니다.')
                return
            }
            if (qo.uri.indexOf('_search') < 0) {
                showMessage('잘 못된 쿼리문장', '_search 키워드를 사용해 주세요.')
                return
            }

            try {
                qo.size = 20
                qo.bShowField = bShowFields
                qo = QueryExec.buildQuery(qo, mytimerange.timerange, pageNum)
            } catch (e) {
                showMessage('잘 못된 쿼리문장', e)
                return
            }

            eventview.render(qo, bRestore)

            // var qparams = QueryExec.getQueryParams(qo)
            // 1. timeline query
            // 2. fields query
            // 3. data query

            console.log(qo)

            // // 3. data query
            // var defer = QueryExec.simpleQuery(qo)
            // defer.done(function (res, from) {
            //     console.log('res', res, from)
            //     eventview.render(res.hits, from)
            //     updateEventCount(res.hits.total.toLocaleString())
            // }).fail(function (res) {
            //     console.log('fail', res)
            // })
        }

        function updateEventCount(count) {
            $('#tab_events').text(' Events (' + count + ')')
        }

        function showMessage(title, message) {
            var modal = new ModalView({
                title: title,
                message: message
            })
            modal.show()
        }

        function printMessage(message, type) {
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
        }

        function getTimeout(isRuntime, gte) {
            if (isRuntime) {
                var m = gte.match(/rt-(\d+)([smh])$/)
                if (!m) {
                    //
                    console.log('timerange.timeout=', m, gte)
                } else {
                    var num = parseInt(m[1], 10)
                    return num * mytimerange.runtimeMod[m[2]]
                }
            }
            return 0       
        }

        function setTimerange() {
            var mtr = mytimerange
            var gte = mtr.val().earliest_time
            var lte = mtr.val().latest_time
            
            mtr.timerange.isRuntime = (gte && gte.indexOf('rt') === 0)
            if (gte === 'rt' && lte === 'rt') {
                // runtime
                mtr.timerange.gte = 0
                mtr.timerange.lte = ''
            } else if (gte === 0 && lte === '') {
                // All time, not runtime
                mtr.timerange.gte = 0
                mtr.timerange.lte = ''
            } else {
                mtr.timerange.gte = modifier.convertToUTC(mtr.val().earliest_time)
                mtr.timerange.lte = modifier.convertToUTC(mtr.val().latest_time)
            }
            mtr.timerange.timeout = getTimeout(mtr.timerange.isRuntime, gte)
        }

        Backbone.Events.on('execQuery', function (pageNum, bRestore) {
            executeQuery(pageNum, bRestore)
        })

        Backbone.Events.on('execError', function (message) {
            printMessage(message)
        })
        Backbone.Events.on('execComplete', function (message) {
            printMessage('')
        })

        setTimeout(function () {
            Backbone.Events.trigger('execQuery', 1, true)
        })
    })