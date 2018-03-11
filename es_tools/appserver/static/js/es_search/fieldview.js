require.config({
    paths: {
        text: "../app/Clay/lib/text"
    }
})

define(["jquery",
    "underscore",
    "backbone",
    "text!../app/Clay/html/es_fieldview.html"
], function ($, _, Backbone, fieldview) {

    var fieldTypes = {
        "string,text,keyword": "a",
        "long, integer, short, byte, double, float, half_float, scaled_float": "#",
        "date": "d",
        "boolean": "t",
        "binary": "b",
        "integer_range, float_range, long_range, double_range, date_range": "r"
    }

    var feildView = Backbone.View.extend({
        "initialize": function (options) {
            var vm = this
            vm.properties = {}
            vm.fields = {}
            vm.maxFields = options.maxFields
            vm.mappings = options.mappings
            vm.el = options.el
            _.defer(fetchFields, vm)
        },
        "render": function () {
            var vm = this
            vm.html = _.template(fieldview, {
                "fields": vm.fields,
                "aggs": vm.aggs,
                "dataType": vm.dataType,
                "maxFields": vm.maxFields,
                "totalSize": _.size(vm.properties)
            })
            $(vm.el).html(vm.html)
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
        "close": function () {
            this.$el.html('')
        }
    })

    var fetchFields = function (that) {
        var vm = that
        _.each(vm.mappings, function (indexObj, indexName) {
            if (indexName.indexOf('.') === 0) {
                return
            }
            _.each(indexObj.mappings, function (typeObj, typeName) {
                if (typeName === '_default_') {
                    return
                }
                _.extend(vm.properties, typeObj.properties)
            })
        })
        _.defer(aggregateFields, vm)
    }

    var aggregateFields = function (that) {
        var vm = that
        var aggs = {}
        _.some(vm.properties, function (obj, key) {
            if (_.size(aggs) === (vm.maxFields * 2)) {
                return true
            }
            aggs[key] = {
                "cardinality": {
                    "field": key
                }
            }
            aggs[key + '_terms'] = {
                "terms": {
                    "field": key,
                    "size": 5,
                    "order": {
                        "_count": "desc"
                    }
                }
            }
            vm.fields[key] = obj
        })
        Backbone.Events.trigger('fieldview:ready', aggs)
    }

    return feildView
})