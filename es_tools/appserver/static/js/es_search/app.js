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
    "es/eventview",
    "es/modalview",
    "es/queryeditor",
    "es/queryexec",
    "ace/ace",
    "text!../app/Clay/html/es_search.html",
    'splunkjs/mvc/simplexml/ready!'
], function (
    $,
    Backbone,
    EventView,
    ModalView,
    QueryEditor,
    QueryExec,
    ace,
    es_search
) {

        $('.dashboard-title').prepend('<i class="icon-search-thin"></i> ')
        $('.dashboard-body').css('min-height', 0)
        $('.dashboard-body').css('padding', '0 20px')
        $(es_search).insertAfter($('.dashboard-body'))

        var queryEditor = new QueryEditor({
            el: $('.search-bar-wrapper.shared-searchbar')
        })

        var eventview = new EventView({
            el: $('.tab-content')
        })

        Backbone.Events.on('execQuery', function (pageNum) {
            executeQuery(pageNum)
        })

        function executeQuery(pageNum, isNew) {
            console.log('executeQuery', pageNum, isNew)
            // 신규 검색
            // 필드 목록 추출
            if (isNew) {
                updateEventCount(0)
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
                qo = QueryExec.rebuildQuery(qo, queryEditor.getTimeRange(), pageNum)
            } catch (e) {
                showMessage('잘 못된 쿼리문장', e)
                return
            }
            // var qparams = QueryExec.getQueryParams(qo)
            // 1. timeline query
            // 2. fields query
            // 3. data query

            console.log('query content', qo)

            // 3. data query
            var defer = QueryExec.simpleQuery(qo)
            defer.done(function (res, from) {
                console.log('res', res, from)
                eventview.render(res.hits, from)
                updateEventCount(res.hits.total.toLocaleString())
            }).fail(function (res) {
                console.log('fail', res)
            })
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

    })