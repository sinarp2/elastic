require.config({
    paths: {
        text: "../app/Clay/lib/text"
    }
})

define(["jquery", "underscore",
    "backbone", "moment",
    "text!../app/Clay/html/es_eventview.html"
], function ($, _, Backbone, moment, template) {

    // table-row-expanding 테이블 drilldown 시 추가 해야할 css 클래스

    var bindingFunc = {
        "_source": onSource,
        "_index": onIndex,
        "_type": onType,
        "_id": onId,
        "_score": onScore
    }

    var view = Backbone.View.extend({
        initialize: function () {
            this.bShowFields = true
        },
        events: {
            'click #btn_hide_fields': function () {
                this.bShowFields = false
                showFields(false)
            },
            'click #btn_all_fields': function () {
                showAllFields(true)
            },
            'click .search-results-eventspane-controls-showfield': function () {
                this.bShowFields = true
                showFields(true)
            }
        },
        render: function (hits, from) {
            this.$el.empty()
            if (hits.total === 0) {
                return
            }

            this.$el.html(template)

            makeNavigation(hits.total, hits.hits.length, from)
            showFields(this.bShowFields)

            var $tr = this.$el.find('[es-repeat]')
            var trHtml = $tr.html().slice(0)
            var tb = $tr.parent()
            $tr.html('')
            for (var i = 0; i < hits.hits.length; i++) {
                var $row = $tr.clone()
                var html = trHtml.slice(0)
                $.each(hits.hits[i], function (key, value) {
                    html = bind(key, value, html)
                })
                html = html.replace(/{{line-num}}/g, '<!--{{line-num}}-->' + (i + 1))
                $(tb).append($row.html(html))
            }
            $tr.hide()
            return this
        }
    })

    function showFields(bShow) {
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
    }

    function showAllFields(bShow) {

    }

    function makeNavigation(total, size, from) {
        var totalPages = Math.ceil(total / size)
        var currPage = Math.ceil(from / size)
        var startPage, endPage, prevPage, nextPage
        if (currPage < 6) {
            startPage = 1
            endPage = (totalPages < 9) ? totalPages : 9
        } else {
            startPage = currPage - 3
            endPage = (totalPages < (currPage + 4)) ? totalPages : (currPage + 4)
        }

        prevPage = (currPage === 1) ? 1 : currPage - 1
        nextPage = (totalPages < (currPage + 1)) ? totalPages : (currPage + 1)

        var $ul = $('.pagination ul')
        var disabled = (currPage === 1) ? 'disabled' : ''
        var html = '<li class="previous ' + disabled + '">\
                        <a class="page-controls" data-page="' + prevPage + '">\
                            <i class="icon-chevron-left"></i>\
                            <span>Prev</span>\
                        </a>\
                    </li>'
        $ul.append(html)

        if (currPage > 5) {
            html = '<li class="number">\
                        <a href="#" data-page="1">1</a>\
                    </li>\
                    <li class="dots disabled">\
                        <a class="dots">...</a>\
                    </li>'
            $ul.append(html)
        }

        for (var i = startPage; i < endPage + 1; i++) {
            var active = (i === currPage) ? 'active' : ''
            html = '<li class="number ' + active + '">\
                        <a href="#" data-page="' + i + '">' + i + '</a>\
                    </li>'
            $ul.append(html)
        }

        if (endPage !== totalPages) {
            html = '<li class="dots disabled">\
                        <a class="dots">...</a>\
                    </li>'
            $ul.append(html)
        }

        disabled = (endPage === totalPages) ? 'disabled' : ''
        html = '<li class="next ' + disabled + '">\
                    <a href="#" class="page-controls" data-page="' + nextPage + '">\
                        <span>Next</span>\
                        <i class="icon-chevron-right"></i>\
                    </a>\
                </li>'
        $ul.append(html)

        $ul.find('a').on('click', function (e) {
            var gotoPage = $(e.target).closest('a').data('page')
            if (gotoPage === currPage) {
                return
            }
            Backbone.Events.trigger('execQuery', gotoPage)
        })
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
        $.each(value, function (key, value) {
            // if (key === "@timestamp") {
            //     return
            // }
            sourceString += '<span class="event_source_key">' + key + ':</span><span class="event_source_value">' + value + '</span>'
        })
        html = html.replace(/{{event_data}}/g, sourceString)
        return html
    }

    function onIndex(key, value, html) {
        return html.replace(/{{index}}/g, value)
    }

    function onType(key, value, html) {
        return html.replace(/{{type}}/g, value)
    }

    function onId(key, value, html) {
        return html.replace(/{{id}}/g, value)
    }

    function onScore(key, value, html) {
        return html.replace(/{{score}}/g, value)
    }

    return view

})