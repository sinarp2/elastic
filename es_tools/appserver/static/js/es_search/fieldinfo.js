require.config({
    paths: {
        es: "../app/Clay/js/es_search",
        text: "../app/Clay/lib/text"
    }
})

define([
    "jquery",
    "underscore",
    'backbone',
    "text!../app/Clay/html/es_fieldinfo.html"
], function ($, _, Backbone, template) {

    var fieldinfo = Backbone.View.extend({
        "initialize": function (options) {
            this.template = _.template(template)
        },
        "render": function () {
            var data = {
                title: this.options.title,
                message: this.options.message
            }
            this.$el.html(this.template(data))
            return this
        },
        "show": function () {
            $(document.body).append(this.render().el)
            // 너비 값 조정 시
            // width 너비를 60%로 할 경우 left 값은 (100 - 60) / 2 = 20%
            // width 너비를 70%로 할 경우 left 값은 (100 - 70) / 2 = 15%
            $(this.el).find('.modal').css({
                width: '50%',
                height: 'auto',
                top: '25%',
                left: '25%',
                'margin-left': '0',
                'max-height': '100%'
            })
        },
        "close": function () {
            this.unbind()
            this.remove()
            _.each(this.childViews, function (childView) {

                childView.unbind()
                childView.remove()

            })
        }
    })

    return fieldinfo
})