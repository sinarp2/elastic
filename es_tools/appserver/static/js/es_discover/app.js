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

    var editor = ace.edit($(".ace_editor").get(0), {
        mode: "ace/mode/text"
    })
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
    } else {
        canStore = false
    }

    $('a.splBorder.btn').click(function (e) {
        toggleCalendar(e.target)
    })

    $('.accordion-toggle').click(function (e) {
        toggleAccordian($(e.target).closest('.accordion-group')[0])
    })

    $('.popdown-dialog').find('div').blur(function() {
        console.log('blur')
    })

    setInterval(saveQuery, 500, editor, canStore)

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

    function toggleCalendar(target) {
        var dlg = $('.popdown-dialog')
        if (dlg.hasClass('open')) {
            $('.popdown-dialog').removeClass('open')
        } else {
            $('.popdown-dialog').addClass('open')
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
})