require.config({
    paths: {
        text: "../app/Clay/lib/text"
    }
})

define([
    "jquery",
    "text!../app/Clay/html/es_eventview.html"
], function ($, template) {

    // table-row-expanding 테이블 drilldown 시 추가 해야할 css 클래스

    function EventView(parent) {
        let _el = template
        let _parent = parent

        this.render = function (hits) {
            $(_parent).empty()
            $(_parent).append(_el)
            var $tr = $(_parent).find('[es-repeat]')
            var trHtml = $tr.html().slice(0)
            //var m = trHtml.match('/(\{\{\S+\}\})/g')
            //console.log(m)
            var tb = $tr.parent()
            $tr.html('')
            for (var i = 0; i < hits.length; i++) {
                var $row = $tr.clone()
                var html = trHtml.slice(0)
                $.each(hits[i], function(key, value) {
                    html = bind(key, value, html)
                })
                // html = html.replace('{{line-num}}', '<!--{{line-num}}-->' + (i + 1))
                // html = html.replace('{{date}}', '<!--{{date}}-->' + source['@timestamp'])
                // html = html.replace('{{event_data}}', '<!--{{event_data}}-->' + JSON.stringify(source))
                $(tb).append($row.html(html))
            }
            $tr.hide()
            return this
        }
    }

    return EventView

    function bind(key, value, html) {
        console.log('key', key, value)
        return html
    }
})