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
    "es_config",
    "text!../app/Clay/html/es_eventview.html"
], function (
    $,
    _,
    Backbone,
    moment,
    es_config,
    eventview
) {

        return Backbone.View.extend({
            el: '.search-results-eventspane-controls',
            fieldview: null,
            bShowFields: true,
            "initialize": function () {
                this.on('search:start', this.search, this)
            },
            "get_model": function () {
                return {
                    qm: this.qm,
                    q: this.q
                }
            },
            "events": {
                "click #btn_hide_fields": function () {
                    this.bShowFields = false
                    this.showFields()
                },
                "click #btn_all_fields": function () {
                    this.showAllFields(true)
                },
                "click .search-results-eventspane-controls-showfield": function () {
                    this.bShowFields = true
                    this.showFields()
                },
                "click ul.ulpager > li > a": function (e) {
                    var $a = $(e.target).closest('a')
                    var gotoPage = $a.data('page')
                    var currPage = $a.data('curr')
                    if (gotoPage === currPage) {
                        return
                    }
                    this.qm.setFrom(this.q, gotoPage)
                    this.goToPage()
                }
            },
            "render": function (model) {
                console.log('render', model)
                var vm = this
                var compile = _.template(eventview)
                var html = compile(model)
                vm.$el.html(html)
                Backbone.Events.trigger('eventview:rendered')
                this.showFields()
            },
            "search": function (qm, q) {
                // this.$el.html('')
                this.qm = $.extend(true, {}, qm)
                this.q = $.extend(true, {}, q)
                this.goToPage()
            },
            "goToPage": function () {
                var vm = this
                var onSuccess = function (res) {
                    vm.dataHandler(res, vm.q.get("from"))
                }
                var onError = function (e) {
                    vm.errorHandler(e)
                }
                console.log('query', vm.q.toJSON())
                $.ajax(es_config.esapi, {
                    data: {
                        method: vm.qm.get("method"),
                        uri: vm.qm.get("uri"),
                        data: JSON.stringify(vm.q)
                    },
                    success: onSuccess,
                    error: onError,
                    dataType: "json"
                })
            },
            "dataHandler": function (res, from) {
                // console.log('datahandler', res, from)
                var jsonResult = JSON.parse(res)
                if (jsonResult.hits && jsonResult.hits.hits) {
                    var hits = jsonResult.hits
                    if (hits.total === 0) {
                        return
                    }
                    var model = {
                        "hits": hits.hits,
                        "pager": {
                            "total": hits.total,
                            "size": hits.hits.length,
                            "from": from
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
            "errorHandler": function (e) {
                console.log(e)
            },
            "showFields": function () {
                if (this.bShowFields) {
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