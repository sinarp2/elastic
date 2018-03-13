require.config({
    paths: {
        es: "../app/Clay/js/es_search",
        ace: "../app/Clay/js/ace",
        text: "../app/Clay/lib/text"
    }
})

define("es_config", function () {
    return {}
})

require([
    "jquery",
    "backbone",
    "es_config",
    "es/utils",
    "text!../app/Clay/html/es_search.html",
    "es/searchview",
    "es/queryeditor",
    "es/querymodel",
    "splunkjs/mvc/searchmanager"
], function (
    $,
    Backbone,
    es_config,
    utils,
    es_search,
    SearchView,
    QueryEditor,
    QueryModel,
    SearchManager
) {
    // var searchview = new SearchView({
    //     el: $(".dashboard-body")
    // })

    var qeditor = null

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
        } else {
            var qo = qm.get_model()
            qm.setTimerange(qo, qeditor.getTimerange().gte, qeditor.getTimerange().lte)
            qm.setFrom(qo, page)
        }
    }

    Backbone.Events.on('editor:search', function (text) {
        startQuery(text, 1)
    })
})