require.config({
    paths: {
        es: "../app/Clay/js/es_search",
        text: "../app/Clay/lib/text"
    }
})

define(["jquery", "underscore",
    "backbone", "moment",
    "es/queryexec",
    "es/fieldview",
    "text!../app/Clay/html/es_eventview.html"
], function ($, _, Backbone, moment, QueryExec, Fieldview, eventview) {

    return Backbone.View.extend({
        "initialize": function (options) {
            this.onShowFields = options.onShowFields
            this.bShowFields = true
        },
        "events": {
            "click #btn_hide_fields": function () {
                this.bShowFields = false
                this.onShowFields(false)
                this.showFields(false)
            },
            "click #btn_all_fields": function () {
                this.showAllFields(true)
            },
            "click .search-results-eventspane-controls-showfield": function () {
                this.bShowFields = true
                this.onShowFields(true)
                this.showFields(true)
            },
            "click ul.ulpager > li > a": function (e) {
                var $a = $(e.target).closest('a')
                var gotoPage = $a.data('page')
                var currPage = $a.data('curr')
                if (gotoPage === currPage) {
                    return
                }
                Backbone.Events.trigger('execQuery', gotoPage)
            }
        },
        "render": function (hits, bShowFieldView) {
            var vm = this
            if (!hits.hits.length) {
                Backbone.Events.trigger('printMessage', 'No results found. Try expanding the time range.')
                return
            }
            vm.$el.html(_.template(eventview, vm.model(hits)))
            vm.showFields(bShowFieldView)
            Backbone.Events.trigger('eventViewRendered')
        },
        "model": function (hits) {
            return {
                "hits": hits,
                "pager": {
                    "total": hits.total,
                    "size": hits.hits.length,
                    "from": hits.from
                },
                "filter": {
                    "date": function (timestamp, format) {
                        var dt = moment(timestamp)
                        return dt.format(format)
                    }
                }
            }
        },
        "showFields": function (bShow) {
            if (bShow) {
                $('.search-results-eventspane-fieldsviewer').css('margin-left', '0')
                $('.shared-eventsviewer-lazyeventsviewer').css('margin-left', '240px')
                $('.shared-controls-syntheticselectcontrol').css('margin-left', '0')
                $('.search-results-eventspane-controls-showfield').css('display', 'none')
            } else {
                $('.search-results-eventspane-fieldsviewer').css('margin-left', '-240px')
                $('.shared-eventsviewer-lazyeventsviewer').css('margin-left', '0')
                $('.shared-controls-syntheticselectcontrol').css('margin-left', '0')
                $('.search-results-eventspane-controls-showfield').css('display', 'block')
            }
        },
        "showAllFields": function (bShow) {

        },
        "close": function () {
            this.$el.html('')
        }
    })
})