require.config({
    paths: {
        text: "../app/Clay/lib/text"
    }
})

define([
    "jquery",
    "moment",
    "text!../app/Clay/html/es_eventview.html"
], function ($, moment, template) {

    // table-row-expanding 테이블 drilldown 시 추가 해야할 css 클래스

    var bindingFunc = {
        "_source" : onSource,
        "_index" : onIndex,
        "_type" : onType,
        "_id" : onId,
        "_score" : onScore
    }

    function EventView(parent) {
        let _el = template
        let _parent = parent

        this.render = function (hits) {
            $(_parent).empty()
            $(_parent).append(_el)
            createEvent()
            showFields(true)
            var $tr = $(_parent).find('[es-repeat]')
            var trHtml = $tr.html().slice(0)
            var tb = $tr.parent()
            $tr.html('')
            for (var i = 0; i < hits.length; i++) {
                var $row = $tr.clone()
                var html = trHtml.slice(0)
                $.each(hits[i], function(key, value) {
                    html = bind(key, value, html)
                })
                html = html.replace(/{{line-num}}/g, '<!--{{line-num}}-->' + (i + 1))
                $(tb).append($row.html(html))
            }
            $tr.hide()
            return this
        }
    }

    return EventView

    function createEvent() {
        $('#btn_hide_fields').on('click', function (e) {
            showFields(false)
        })
        $('#btn_all_fields').on('click', e => {
            showAllFields(true)
        })
    }

    function showFields(bShow) {
        if (bShow) {
            $('.search-results-eventspane-fieldsviewer').css('margin-left', '0')
            $('.lazy-view-container').css('margin-left', '240px')
        } else {
            $('.search-results-eventspane-fieldsviewer').css('margin-left', '-240px')
            $('.lazy-view-container').css('margin-left', '0')
        }
    }

    function showAllFields(bShow) {

    }

    function bind(key, value, html) {
        if (bindingFunc.hasOwnProperty(key)) {
            return bindingFunc[key](key, value, html)
        }
        return html
    }

    function onSource(key, value, html) {
        var ts = value['@timestamp']
        var dt = moment(ts)
        html = html.replace(/{{date}}/g, '<!--{{date}}-->' + dt.format('YYYY-MM-DD'))
        html = html.replace(/{{time}}/g, '<!--{{time}}-->' + dt.format('hh:mm:ss.SSS ZZ'))
        var sourceString = ''
        $.each(value, function(key, value) {
            // if (key === "@timestamp") {
            //     return
            // }
            sourceString += '<span class="event_source_key">' + key + ':</span><span class="event_source_value">' + value + '</span>'
        })
        html = html.replace(/{{event_data}}/g, '<!--{{event_data}}-->' + sourceString)
        return html
    }

    function onIndex(key, value, html) {
        return html.replace(/{{index}}/g, '<!--{{index}}-->' + value)
    }

    function onType(key, value, html) {
        return html.replace(/{{type}}/g, '<!--{{type}}-->' + value)
    }

    function onId(key, value, html) {
        return html.replace(/{{id}}/g, '<!--{{id}}-->' + value)
    }

    function onScore(key, value, html) {
        return html.replace(/{{score}}/g, '<!--{{score}}-->' + value)
    }

})