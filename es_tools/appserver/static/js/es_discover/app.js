require.config({
    paths: {
        ace: "../app/Clay/js/ace"
    }
});

require([
    "jquery",
    "ace/ace",
    'splunkjs/mvc/simplexml/ready!'
], function (
    $,
    ace
) {

    $('.dashboard-title').prepend('<i class="icon-search-thin"></i>')

    var esapi = "/custom/Clay/estools/esapi"
    var canStore = false
    var timerange = null

    var editor = ace.edit($(".ace_editor").get(0), {
        mode: "ace/mode/text"
    })

    function init() {

        editor.setValue('', -1)
        editor.setShowPrintMargin(false)
        editor.$blockScrolling = Infinity
        editor.renderer.setShowGutter(false)
        editor.setHighlightActiveLine(false)
        editor.session.setUseWrapMode(true)
        editor.setOptions({
            minLines: 2
        })

        editor.commands.addCommand({
            name: "executeQuery",
            bindKey: {
                win: "Enter",
                mac: "Return"
            },
            exec: call_api
        })

        editor.session.on('change', function (delta) {
            resizeEditor()
        })

        editor.on('focus', function () {
            $('.ace_editor').addClass('focused')
        })

        editor.on('blur', function () {
            $('.ace_editor').removeClass('focused')
        })

        editor.focus()

        if (typeof (Storage) !== "undefined") {
            canStore = true
            if (localStorage.discover_history) {
                editor.setValue(localStorage.discover_history, -1)
            }
            if (sessionStorage.timerange) {
                try {
                    timerange = $.parseJSON(sessionStorage.getItem('timerange'))
                } catch (e) {
                    timerange = null
                }
            }
        } else {
            canStore = false
        }

        setInterval(saveQuery, 500, editor, canStore)

        $('a.splBorder.btn').click(function (e) {
            toggleCalendar()
        })

        $('.accordion-toggle').click(function (e) {
            toggleAccordian($(e.target).closest('.accordion-group')[0])
        })

        $('.presets-group').find('a').click(function (e) {
            setPresets(e.target)
        })

        $('.dropdown-toggle').click(function (e) {
            toggleDropdown(e)
        })

        setTimeRangeTitle()

        setCloseWindow()
    }

    function setTimeRangeTitle() {
        if (!timerange) {
            timerange = {
                idx: 0,
                title: 'Last 24 hours',
                data: {
                    earliest: '-24h@h',
                    latest: 'now'
                }
            }
        }
        $('.time-label').attr('title', timerange.title)
        $('.time-label').text(timerange.title)
        $($('.accordion-toggle')[timerange.idx]).click()
        sessionStorage.setItem('timerange', JSON.stringify(timerange))
    }

    function setPresets(t) {
        timerange = {
            type: 'Presets',
            idx: 0,
            title: $(t).text(),
            data: $(t).data()
        }
        setTimeRangeTitle()
        toggleCalendar()
    }

    function saveQuery(editor, canStore) {
        if (canStore) {
            localStorage.setItem('discover_history', editor.getValue())
        }
    }

    function resizeEditor() {
        var newHeight =
            editor.getSession().getScreenLength() *
            editor.renderer.lineHeight +
            editor.renderer.scrollBar.getWidth();
        $('pre.ace_editor').height(newHeight.toString() + "px")
        editor.resize();
    }

    function call_api(editor) {
        console.log('api call', editor.getValue())
        return true
    }

    function toggleDropdown(e) {
        var el = $(e.target).closest('.dropdown-toggle')
        var dropdown = $(el).next('.dropdown-menu')
        if (dropdown.hasClass('open')) {
            dropdown.removeClass('open')
        } else {
            dropdown.addClass('open')
        }
    }

    function toggleCalendar() {
        var dlg = $('.popdown-dialog')
        console.log('toggle', $(dlg).hasClass('open'))
        if (dlg.hasClass('open')) {
            dlg.removeClass('open')
        } else {
            dlg.addClass('open')
        }
    }

    function toggleAccordian(group) {
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
            if (!isInbound(el1, e.pageX, e.pageY) && !isInbound(el2, e.pageX, e.pageY)) {
                el1.removeClass('open')
            }
        }

        function checkPopdownDialog(e) {
            var el1 = $('.popdown-dialog')
            if (!el1.hasClass('open')) {
                return
            }
            var el2 = $('.search-timerange')
            if (!isInbound(el1, e.pageX, e.pageY) && !isInbound(el2, e.pageX, e.pageY)) {
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

    init()
})