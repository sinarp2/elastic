require.config({
    paths: {
        es: "../app/Clay/js/es_search",
        text: "../app/Clay/lib/text"
    }
})

define([
    "jquery",
    "underscore",
    "backbone",
    "moment",
    "es/queryexec",
    "es/fieldview",
    "text!../app/Clay/html/es_eventview.html"
], function (
    $,
    _,
    Backbone,
    moment,
    QueryExec,
    Fieldview,
    eventview
) {

        return Backbone.View.extend({
            el: '.search-results-eventspane-controls',
            fieldview: null,
            "initialize": function () {
                this.on('search:start', this.search, this)
                this.fieldview = new FieldView()
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
                }
            },
            "render": function (model) {
                var vm = this
                var compile = _.template(eventview)
                var html = compile(model)
                vm.$el.html(html)
            },
            "search": function (qm, q) {
                var vm = this
                var onSuccess = function(res) {
                    vm.dataHandler(res)
                }
                var onError = function(e) {
                    vm.errorHandler(e)
                }
                $.ajax("/custom/Clay/estools/esapi", {
                    data: {
                        method: qm.get("method"),
                        uri: qm.get("uri"),
                        data: JSON.stringify(q)
                    },
                    success: onSuccess,
                    error: onError,
                    dataType: "json"
                })
            },
            "dataHandler": function (res) {
                var jsonResult = JSON.parse(res)
                if (jsonResult.hits && jsonResult.hits.hits) {
                    var hits = jsonResult.hits
                    if (hits.total === 0) {
                        return
                    }
                    var model = {
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
                    this.render(model)
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

            }
        })
    })