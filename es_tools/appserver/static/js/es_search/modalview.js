define([
    "jquery",
    "underscore",
    'backbone'
], function ($, _, Backbone) {

    var modalTemplate = '<div class="modal">' +
        '<div class="modal-header"><h3><%=title%></h3></div>' +
        '<div class="modal-body"><%=message%></div>' +
        '<div class="modal-footer"><button class="close">Close</button></div>' +
        '</div>' +
        '<div class="modal-backdrop"></div>'

    var ModalView = Backbone.View.extend({
        defaults: {
            title: 'Not set'
        },
        initialize: function (options) {
            this.options = options
            this.options = _.extend({}, this.defaults, this.options)
            this.childViews = []
            this.template = _.template(modalTemplate)
        },
        events: {
            'click .close': 'close',
            'click .modal-backdrop': 'close'
        },
        render: function () {
            var data = {
                title: this.options.title,
                message: this.options.message
            }
            this.$el.html(this.template(data))
            return this
        },
        show: function () {
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
        close: function () {
            this.unbind()
            this.remove()
            _.each(this.childViews, function (childView) {

                childView.unbind()
                childView.remove()

            })
        }

    })

    return ModalView

})