require.config({
    paths: {
        text: "../app/Clay/lib/text"
    }
})

define([
    "jquery",
    "underscore",
    "backbone",
    "text!../app/Clay/html/es_timerange.html"
], function ($, _, Backbone, template) {

    var view = Backbone.View.extend({
        initialize: function () {
            if (typeof (Storage) !== "undefined") {
                this.canStore = true
                if (sessionStorage.timerange) {
                    try {
                        this.timerange = $.parseJSON(sessionStorage.getItem('timerange'))
                    } catch (e) {
                        this.timerange = null
                    }
                }
            } else {
                this.canStore = false
            }
            this.render()
            setCloseWindow()
        },
        events: {
            'click a.splBorder.btn': toggleCalendar,
            'click .accordion-toggle': toggleAccordian,
            'click .dropdown-toggle': toggleDropdown,
            'click .presets-group > li > a': setPresets
        },
        render: function () {
            this.$el.append(_.template(template));
            this.timerange = {
                idx: 0,
                title: 'Last 24 hours',
                gte: '-24h/h',
                lte: 'now'
            }
            this.delegateEvents()
            setTimeRangeTitle(this.timerange, this.canStore)
            return this
        },
        getTimerange: function () {
            return this.timerange
        }
    })

    function setPresets(e) {
        console.log('setPresets', $(e.target).data())
        this.timerange = {
            type: 'Presets',
            idx: 0,
            title: $(e.target).text()
        }
        _.extend(this.timerange, $(e.target).data())
        setTimeRangeTitle(this.timerange, this.canStore)
        toggleCalendar()
    }

    function setTimeRangeTitle(timerange, canStore) {
        $('.time-label').attr('title', timerange.title)
        $('.time-label').text(timerange.title)
        $($('.accordion-toggle')[timerange.idx]).click()
        if (canStore) {
            sessionStorage.setItem('timerange', JSON.stringify(timerange))
        }
    }

    /*
     * 가간 설정 창 내 dropdown 창을 열고 닫는다
     */
    function toggleDropdown(e) {
        var el = $(e.target).closest('.dropdown-toggle')
        var dropdown = $(el).next('.dropdown-menu')
        if (dropdown.hasClass('open')) {
            dropdown.removeClass('open')
        } else {
            dropdown.addClass('open')
        }
    }

    /*
     * 가간 설정 창을 열고 닫는다
     */
    function toggleCalendar() {
        var dlg = $('.popdown-dialog')
        if (dlg.hasClass('open')) {
            dlg.removeClass('open')
        } else {
            dlg.addClass('open')
        }
    }

    /*
     * 기간 설정 창의 Accordion 기능 구현
     * 클릭 시 특정 Accordion 창을 열고 닫는다
     */
    function toggleAccordian(e) {
        var group = $(e.target).closest('.accordion-group')[0]
        if ($(group).hasClass('active')) {
            return
        }
        $('.accordion-group').removeClass('active')
        $(group).addClass('active')
        $('i.icon-accordion-toggle.icon-triangle-down-small')
            .removeClass('icon-triangle-down-small')
            .addClass('icon-triangle-right-small')
        $(group).find('i.icon-accordion-toggle')
            .removeClass('icon-triangle-right-small')
            .addClass('icon-triangle-down-small')
        $('.accordion-body').slideUp()
        $(group).find('.accordion-body').slideDown()
    }

    /*
     * 화면을 클릭하면 dropdown, popdown 창이 떠 있는 경우 창을 닫는다
     * dropdown, popdown 창 내에서의 클릭인 경우 스킵
     */
    function setCloseWindow() {

        $(document).click(function (e) {
            checkPopdownDialog(e)
            var btns = $('.dropdown-toggle')
            $('.dropdown-menu').each(function (idx) {
                if ($(this).hasClass('open')) {
                    checkDropdownMenu($(this), $(btns.get(idx)), e)
                }
            })
        })

        function checkDropdownMenu(el1, el2, e) {
            if (e.pageX &&
                e.pageY &&
                !isInbound(el1, e.pageX, e.pageY) &&
                !isInbound(el2, e.pageX, e.pageY)) {
                el1.removeClass('open')
            }
        }

        function checkPopdownDialog(e) {
            var el1 = $('.popdown-dialog')
            if (!el1.hasClass('open')) {
                return
            }
            var el2 = $('.search-timerange')
            if (e.pageX &&
                e.pageY &&
                !isInbound(el1, e.pageX, e.pageY) &&
                !isInbound(el2, e.pageX, e.pageY)) {
                el1.removeClass('open')
            }
        }

        function isInbound(el, x, y) {
            if (x > el.offset().left && x < el.offset().left + el.width() &&
                y > el.offset().top && y < el.offset().top + el.height()) {
                return true
            } else {
                return false
            }
        }
    }

    return view
})