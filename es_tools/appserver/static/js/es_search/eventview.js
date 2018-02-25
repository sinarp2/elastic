require.config({
    paths: {
        split: "../app/Clay/js",
        text: "../app/Clay/lib/text"
    }
})

define([
    "jquery",
    'split/split.min',
    "text!../app/Clay/html/es_eventview.html"
], function ($, Split, template) {

    function EventView() {
        this.el = ''
        this.split = null
        this.height = 0
        init(this)
    }

    EventView.prototype.constructor = EventView
    EventView.prototype.addHandler = addHandler
    EventView.prototype.render = render

    return EventView

    function addHandler() {

    }

    function render(parent) {
        if (this.split) {
            this.split.destroy()
        }
        //$(parent).remove('.split-container')
        $(parent).append(this.el)
        // this.split = Split(['#fieldsviewer', '#lazy-view-container'], {
        //     minSize: [200],
        //     gutterSize: 1
        // })
        $('.split-horizontal').on('resize', function (e) {
            console.log('resize', e)
        })
        return this
    }

    function init(c) {
        c.el = template
        setInterval(function () {
            if ($('.split-container')) {
                var h1 = $('#fieldsviewer').height()
                var h2 = $('#lazy-view-container').height()
                var h = (h1 > h2) ? h1 : h2
                if (h !== this.height) {
                    this.height = h
                    $('.split-container').height(this.height)
                }
            }
        }, 200)
    }
})