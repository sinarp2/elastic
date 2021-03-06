require.config({
    paths: {
        es: "../app/Clay/js/es_search",
        ace: "../app/Clay/js/ace",
        text: "../app/Clay/lib/text"
    }
})

define("es_config", function () {
    return {
        esapi: "/custom/Clay/estools/esapi"
    }
})

require([
    "jquery",
    "backbone",
    "es_config",
    "text!../app/Clay/html/es_search.html",
    "es/utils",
    "es/timelineview",
    "es/eventview",
    "es/fieldview",
    "es/queryeditor",
    "es/querymodel",
    "splunkjs/mvc/searchmanager"
], function (
    $,
    Backbone,
    es_config,
    es_search,
    utils,
    TimelineView,
    EventView,
    FieldView,
    QueryEditor,
    QueryModel,
    SearchManager
) {
    var qeditor = null
    var timeline = null
    var eventview = null
    var fieldview = null

    var search1 = new SearchManager({
        search: '| makeresults | eval zone=strftime(time(),"%z")'
    })

    var myResults = search1.data("results"); // get the data from that search
    myResults.on("data", function () {
        if (es_config.timezone) {
            return
        }
        resultArray = myResults.data().rows;
        es_timezone = resultArray[0][1]
        es_config.timezone = es_timezone
        init_page()
    })

    $.get('/custom/Clay/estools/get_eshost').done(function (res) {
        es_config.es_host = res.host
        init_page()
    })

    function init_page() {
        if (!es_config.timezone || !es_config.es_host || es_config.initialized) {
            return
        }
        es_config.initialized = true
        $('.dashboard-title').prepend('<i class="icon-search-thin"></i> ')
        $('.dashboard-body').css('min-height', 0)
        $('.dashboard-body').css('padding', '0 20px')
        $(es_search).insertAfter($(".dashboard-body"))

        qeditor = new QueryEditor({
            el: $('.search-bar-wrapper.shared-searchbar')
        })
        qeditor.render()

        timeline = new TimelineView()
        eventview = new EventView()
        fieldview = new FieldView()

        var text = qeditor.getValue()
        if (text) {
            startQuery(text, 1)
        }
    }

    function startQuery(text, page) {
        var qm = new QueryModel({
            "qstr": text,
            "size": 10
        })
        if (!qm.isValid()) {
            console.log('query not valid', qm.validationError)
            return
        }
        var q = qm.get_model()
        var tr = qeditor.getTimerange()
        qm.setTimerange(q, tr.gte, tr.lte)
        qm.setFrom(q, page)

        timeline.trigger('search:start', qm, q)
        eventview.trigger('search:start', qm, q)
        fieldview.trigger('search:start', qm, q)
    }

    Backbone.Events.on('editor:search', function (text) {
        startQuery(text, 1)
    })

    Backbone.Events.on('timerange:change', function () {
        startQuery(qeditor.getValue(), 1)
    })

    Backbone.Events.on('timeline:selection', function (e) {
        e.preventDefault()
        console.log('selected', e)
        // if (timeline.isFirst) {
        //     timeline.isFirst = null
        //     return
        // }
        // var gte = parseInt(e.data.start) * 1000
        // var lte = parseInt(e.data.end) * 1000
        // var qm = eventview.get_model().qm
        // var q = eventview.get_model().q

        // qm.setTimerange(q, gte, lte)
        // qm.setFrom(q, 1)
        // // timeline.trigger('search:start', qm, q)
        // eventview.trigger('search:start', qm, q)
        // fieldview.trigger('search:start', qm, q)
    })

    Backbone.Events.on('timeline:click', function (e) {
        e.preventDefault()
        console.log('clicked', e)
        // var gte = parseInt(e.value) * 1000
        // var lte = gte + 3650000
        // var qm = eventview.get_model().qm
        // var q = eventview.get_model().q

        // qm.setTimerange(q, gte, lte)
        // qm.setFrom(q, 1)
        // timeline.trigger('search:start', qm, q)
        // eventview.trigger('search:start', qm, q)
        // fieldview.trigger('search:start', qm, q)
    })
})