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
            console.log('options', options)
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
        "render": function (qo, isNew) {
            var vm = this
            if (isNew) {
                // 신규 검색
                $.when(QueryExec.hitsQuery(qo),
                    QueryExec.fieldsQuery(qo),
                    QueryExec.timelineQuery(qo)).done(function (events, fields, timeln) {
                        vm.fieldview = new Fieldview({
                            "mappings": fields[0],
                            "el": ".search-results-eventspane-fieldsviewer"
                        })
                        var html = vm.compile(events[0], fields[0], timeln[0], qo.from)
                        vm.$el.html(html)
                        vm.fieldview.render()
                        vm.showFields(qo.bShowField)
                    }).fail(function (e) {
                        Backbone.Events.trigger('execError', e)
                    })
            } else {
                // 페이징 처리
                QueryExec.hitsQuery(qo).done(function (res, status, xhr) {
                    var html = vm.compile(res, null, null, qo.from)
                    vm.fieldview.cache()
                    vm.$el.html(html)
                    vm.fieldview.render()
                    vm.showFields(qo.bShowField)
                }).fail(function (e) {
                    Backbone.Events.trigger('execError', e)
                })
            }
        },
        "compile": function (events, fields, timeln, from) {
            var vm = this
            vm.events = events
            vm.fields = fields || vm.fields
            vm.timeln = timeln || vm.timeln
            return _.template(eventview, vm.model(vm.events.hits, vm.fields, vm.timeln, from))
        },
        "model": function (hits, fields, timeln, from) {
            return {
                "hits": hits,
                "fields": fields,
                "timeln": timeln,
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
        },
        "showFields": function (bShow) {
            if (bShow) {
                $('.search-results-eventspane-fieldsviewer').css('margin-left', '0')
                $('.lazy-view-container').css('margin-left', '240px')
                $('.shared-controls-syntheticselectcontrol').css('margin-left', '0')
                $('.search-results-eventspane-controls-showfield').css('display', 'none')
            } else {
                $('.search-results-eventspane-fieldsviewer').css('margin-left', '-240px')
                $('.lazy-view-container').css('margin-left', '0')
                $('.shared-controls-syntheticselectcontrol').css('margin-left', '0')
                $('.search-results-eventspane-controls-showfield').css('display', 'block')
            }
        },
        "showAllFields": function (bShow) {
        }
    })
})