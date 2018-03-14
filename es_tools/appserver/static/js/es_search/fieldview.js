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
    "es_config",
    "es/fieldinfo",
    "text!../app/Clay/html/es_fieldview.html"
], function (
    $,
    _,
    Backbone,
    es_config,
    FieldInfo,
    fieldview
) {

        var fieldTypes = {
            "string,text,keyword": "a",
            "long, integer, short, byte, double, float, half_float, scaled_float": "#",
            "date": "d",
            "boolean": "t",
            "binary": "b",
            "integer_range, float_range, long_range, double_range, date_range": "r"
        }

        var feildView = Backbone.View.extend({
            el: '.search-results-eventspane-fieldsviewer',
            maxFields: 20,
            "initialize": function () {
                var vm = this
                this.on('search:start', this.search_fields, this)
                Backbone.Events.on('eventview:rendered', function () {
                    vm.render()
                })
            },
            "search_fields": function (qm, q) {
                var vm = this
                this.qm = $.extend(true, {}, qm)
                this.q = $.extend(true, {}, q)
                var uri = qm.get("index") || '_all'
                uri = uri + '/_mappings'
                var onSuccess = function (res) {
                    vm.extractFields(res)
                }
                var onError = function (e) {
                    vm.errorHandler(e)
                }
                $.ajax(es_config.esapi, {
                    data: {
                        method: qm.get("method"),
                        uri: uri,
                        data: ''
                    },
                    success: onSuccess,
                    error: onError,
                    dataType: "json"
                })
            },
            "extractFields": function (res) {
                var vm = this
                vm.properties = {}
                vm.cardinalities = {}
                vm.termsaggrs = {}
                var jsonResult = JSON.parse(res)
                _.each(jsonResult, function (obj, key) {
                    if (key.indexOf('.') === 0) {
                        return
                    }
                    _.each(obj.mappings, function(obj, key) {
                        if (key === '_default_') {
                            return
                        }
                        _.extend(vm.properties, obj.properties)
                    })
                })
                _.some(vm.properties, function(obj, key) {
                    if (_.size(vm.properties) > vm.maxFields) {
                        return true
                    }
                    vm.cardinalities[key] = {
                        "cardinality": {
                            "field": key
                        }
                    }
                    vm.termsaggrs[key] = {
                        "terms": {
                            "field": key,
                            "size": 5,
                            "order": {
                                "_count": "desc"
                            }
                        }
                    }
                })
                vm.updateCardinality()
            },
            "updateCardinality": function () {
                var vm = this
                var qm = this.qm
                var q = this.q
                var onSuccess = function (res) {
                    var jsonResult = JSON.parse(res)
                    vm.aggregations = jsonResult.aggregations
                }
                var onError = function (e) {
                    vm.errorHandler(e)
                }
                var data = {
                    "aggs": vm.cardinalities,
                    "query": q.get("query"),
                    "size": 0
                }
                $.ajax(es_config.esapi, {
                    data: {
                        method: qm.get("method"),
                        uri: qm.get("uri"),
                        data: JSON.stringify(data)
                    },
                    success: onSuccess,
                    error: onError,
                    dataType: "json"
                })
            },
            "updateFieldView": function () {
                var aggs = this.aggregations
                $('a.fields-info').each(function (idx, el) {
                    let fname = $(el).data('field-name')
                    let obj = aggs[fname]
                    $(el).find('.field-count').text(obj.value)
                })
            },
            "errorHandler": function (e) {
                console.log(e.responseText)
            },
            "render": function () {
                var vm = this
                var html = _.template(fieldview, {
                    "fields": vm.properties,
                    "dataType": vm.dataType,
                    "maxFields": vm.maxFields,
                    "totalSize": _.size(vm.properties)
                })
                $(document).find('.search-results-eventspane-fieldsviewer').html(html)
                $('.fields-info').on('click', this.showFieldInfo)
                vm.updateFieldView()
            },
            "dataType": function (type) {
                var ch = '?'
                _.some(fieldTypes, function (val, key) {
                    if (key.indexOf(type) > -1) {
                        ch = val
                        return true
                    }
                })
                return ch
            },
            "showFieldInfo": function (e) {
                console.log('show fieldinfo', $(e.target).data('field-name'), this.aggs)
            }
        })

        return feildView
    })