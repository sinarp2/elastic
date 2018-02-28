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
        if (pageNum === 0) {
            updateEventCount(0)
        }
        console.log('timerange', queryEditor.getTimeRange())
        var defer = QueryExec.simpleQuery(queryEditor.getValue(), pageNum)
        defer.done(function (res, from) {
            eventview.render(res.hits, from)
            updateEventCount(res.hits.total.toLocaleString())
        }).fail(function (res) {
            console.log('fail', res)
        })
    })

    function updateEventCount(count) {
        $('#tab_events').text(' Events (' + count + ')')
    }

    function _showMessage(title, message) {
        var modal = new ModalView({
            title: title,
            message: message
        })
        modal.show()
    }

})