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
    "es/searchview",
    "splunkjs/mvc/simplexml/ready!"
], function (
    $,
    Backbone,
    moment,
    SearchView
) {
        var searchview = new SearchView({
            el: $(".dashboard-body")
        }).render()

    })