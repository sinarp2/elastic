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
    "splunkjs/mvc/searchmanager",
    "splunkjs/mvc/simplexml/ready!"
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


    var search1 = new SearchManager({
        id: "timezone-search",
        autostart: true,
        search: '| makeresults | eval zone=strftime(time(),"%z")',
        preview: true,
        cache: false
    })

    var myResults = search1.data("results"); // get the data from that search
    myResults.on("data", function () {
        resultArray = myResults.data().rows;
        es_timezone = resultArray[0][1]
        es_config.timezone = es_timezone
        $.get('/custom/Clay/estools/get_eshost').done(function (res) {
            es_config.es_host = res.host
            init_page()
        })
    })

    function init_page() {
        $('.dashboard-title').prepend('<i class="icon-search-thin"></i> ')
        $('.dashboard-body').css('min-height', 0)
        $('.dashboard-body').css('padding', '0 20px')
        $(es_search).insertAfter($(".dashboard-body"))

        var qeditor = new QueryEditor({
            el: $('.search-bar-wrapper.shared-searchbar')
        }).render()

        var search_str = qeditor.getValue()
        if (search_str) {
            var qm = new QueryModel({
                "qstr": search_str
            })
            if (!qm.isValid()) {
                console.log('query not valid', qm.validationError)
            } else {
                var qo = qm.get_model()
                if (!qm.isUserTimerange()) {
                    console.log('set timerange', qm.isUserTimerange(), qeditor.getTimerange())
                }
                console.log('qo', qo.toJSON())
            }
        }
    }

    Backbone.Events.on('editor:search', function (e) {
        console.log('editor enter', e)
    })
})