require.config({
    paths: {
        text: "../app/Clay/lib/text"
    }
})

define([
    "jquery",
    "underscore",
    "backbone",
    "moment",
    "text!../app/Clay/html/es_timerange.html"
], function ($, _, Backbone, moment, template) {

    var datetime = {
        "rt": () => moment().utc().format(),
        "rt-30s": () => moment().utc().subtract(30, 's').format(),
        "rt-1m": () => moment().utc().subtract(1, 's').format(),
        "rt-5m": () => moment().utc().subtract(5, 'm').format(),
        "rt-30m": () => moment().utc().subtract(30, 'm').format(),
        "rt-1h": () => moment().utc().subtract(1, 'h').format(),
        "now": () => moment().utc().format(),
        "@d": () => moment().utc().format('YYYY-MM-DDT00:00:00'),
        "@w0": () => moment().utc().weekday(0).format('YYYY-MM-DDT00:00:00'),
        "@w1": () => moment().utc().weekday(1).format('YYYY-MM-DDT00:00:00'),
        "-7d@w0": () => moment().utc().weekday(-7).format('YYYY-MM-DDT00:00:00'),
        "-6d@w1": () => moment().utc().weekday(-6).format('YYYY-MM-DDT00:00:00'),
        "-1d@w6": () => moment().utc().weekday(-2).format('YYYY-MM-DDT00:00:00'),
        "@mon": () => moment().utc().date(1).format('YYYY-MM-DDT00:00:00'),
        "@y": () => moment().utc().dayOfYear(1).format('YYYY-MM-DDT00:00:00'),
        "-1d@d": () => moment().utc().subtract(1, 'd').format('YYYY-MM-DDT00:00:00'),
        "@d": () => moment().utc().format('YYYY-MM-DDT00:00:00'),
        "-1mon@mon": () => moment().utc().startOf('month').subtract(1, 'M').format('YYYY-MM-DDT00:00:00'),
        "-1y@y": () => moment().utc().startOf('year').subtract(1, 'y').format('YYYY-MM-DDT00:00:00'),
        "-15m": () => moment().utc().subtract(15, 'm').format(),
        "-60m@m": () => moment().utc().subtract(60, 'm').format(),
        "-4h@m": () => moment().utc().subtract(4, 'h').format(),
        "-24h@h": () => moment().utc().subtract(24, 'h').format(),
        "-7d@h": () => moment().utc().subtract(1, 'm').format(),
        "-30d@d": () => moment().utc().subtract(1, 'm').format('YYYY-MM-DDT00:00:00')
    }

    var dtRound = {
        "@y": "YYYY-01-01T00:00:00",
        "@mon": "YYYY-MM-01T00:00:00",
        "@d": "YYYY-MM-DDT00:00:00",
        "@h": "YYYY-MM-DDThh:00:00",
        "@m": "YYYY-MM-DDThh:mm:00",
        "@s": "YYYY-MM-DDThh:mm:ss",
        "@w0": "",
        "@w1": "",
        "-": (mom, num, unit, round) => {
            return mom.subtract(num, unit)
        },
        "+": (mom, num, unit, round) => {
            return mom.add(num, unit)
        }
    }

    var datetimeRound = {
        "/y": "YYYY-01-01T00:00:00",
        "/M": "YYYY-MM-01T00:00:00",
        "/d": "YYYY-MM-DDT00:00:00",
        "/h": "YYYY-MM-DDThh:00:00",
        "/m": "YYYY-MM-DDThh:mm:00",
        "/s": "YYYY-MM-DDThh:mm:ss",
        "/w": "",
        "other": ""
    }

    function patternToUTC(mod) {
        if (!mod) {
            return null
        }
        var match = mod.match(/(-|\+)(\d+)(mon|[ydhmsw])($|@mon|@[ydhmsw]|@w[0-7])$/)
        if (!match) {
            return null
        }
        var plus_minus = match[1]
        var num = match[2]
        var unit = match[3]
        var round = match[4]

    }

    var view = Backbone.View.extend({
        "initialize": function () {
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
        "events": {
            "click a.splBorder.btn": toggleCalendar,
            "click .accordion-toggle": toggleAccordian,
            "click .dropdown-toggle": toggleDropdown,
            "click .presets-group > li > a": setPresets,
            "click .apply-advenced": setAdvenced,
            "click .mdy-input": showCalender,
            "keydown .advanced-timeinput-earliest": _.debounce(onKeyUpAdvenced, 250),
            "keyup .advanced-timeinput-latest": _.debounce(onKeyUpAdvenced, 250)
        },
        "render": function () {
            this.$el.append(_.template(template));
            this.timerange = {
                idx: 0,
                title: 'Last 24 hours',
                gte: '-24h@h',
                lte: 'now'
            }
            this.delegateEvents()
            setTimeRangeTitle(this.timerange, this.canStore)
            return this
        },
        "getTimerange": function () {
            return this.timerange
        }
    })

    function showCalender(e) {
        e.preventDefault()
        $(e.target).datepicker()
        console.log('calender', $(e.target).datepicker())
    }

    function onKeyUpAdvenced(e) {

        e.preventDefault()

        var $p = $(e.target).parent()
        var $span = $p.find('.shared-timerangepicker-dialog-advanced-timeinput-hint')
        var $alert = $('.accordion-body:visible').find('.alerts.shared-flashmessages')

        $alert.hide()

        if (e.target.value === 'now') {
            $span.text(moment().utc().format())
            return
        }
        var m = e.target.value.match(/(now-)(\d+)([yMdhms])(\/[yMdhms])?/)
        if (!m) {
            $span.text('Invalid Format')
            $alert.show()
            return
        }

        var num = parseInt(m[2], 10)
        var unit = m[3]
        var round = m[4] || 'other'

        var t = moment().subtract(num, unit).utc().format(datetimeRound[round])
        $span.text(t)
    }

    function setPresets(e) {
        this.timerange = {
            type: 'Presets',
            idx: 0,
            runtime: ($(e.target).data().latest === 'rt'),
            title: $(e.target).text(),
            gte: getDateString($(e.target).data().gte),
            lte: getDateString($(e.target).data().latest)
        }
        setTimeRangeTitle(this.timerange, this.canStore)
        toggleCalendar()
        console.log('setPresets', this.timerange)
    }

    function setAdvenced(e) {

        var $div1 = $($('.time-advanced')[0])
        var $div2 = $($('.time-advanced')[1])
        var gte = $div1.find('input').attr('value')
        var lte = $div2.find('input').attr('value')

        console.log('advenced earliest', $div1.find('input').attr('value'), $div2.find('input').attr('value'))
    }

    function getDateString(str) {
        if (!str) {
            return ""
        } else {
            return datetime[str]()
        }
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