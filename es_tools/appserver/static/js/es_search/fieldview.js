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

    return Backbone.View.extend({
        "initialize": function (options) {
            var vm = this
            vm.properties = {}
            vm.el = options.el
            vm._fetchFields(options.mappings)
        },
        "render": function () {
            var vm = this
            $(vm.el).html(vm.html)
        },
        "cache": function () {
            var vm = this
            vm.html = $(vm.el).html()
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
        "_fetchFields": function (mappings) {
            var vm = this
            _.defer(function () {
                _.some(mappings, function (indexObj, indexName) {
                    if (indexName.indexOf('.') === 0) {
                        return
                    }
                    _.some(indexObj.mappings, function (typeObj, typeName) {
                        if (typeName === '_default_') {
                            return
                        }
                        if (_.keys(vm.properties).length > 20) {
                            return true
                        }
                        _.extend(vm.properties, typeObj.properties)
                    })
                })
                vm.html = _.template(fieldview, {
                    "props": vm.properties,
                    "dataType": vm.dataType
                })
                if (vm.el) {
                    $(vm.el).html(vm.html)
                }
            })
        }
    })
})