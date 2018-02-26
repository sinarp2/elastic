require.config({
    paths: {
        es: "../app/Clay/js/es_search",
        ace: "../app/Clay/js/ace",
        text: "../app/Clay/lib/text"
    }
})

require([
    "jquery",
    "es/timerange",
    "es/eventview",
    "es/modalview",
    "ace/ace",
    "text!../app/Clay/html/es_search.html",
    'splunkjs/mvc/simplexml/ready!'
], function (
    $,
    TimerangeDlg,
    EventView,
    ModalView,
    ace,
    es_search,
    es_eventview,
    LayoutView
) {

    $('.dashboard-title').prepend('<i class="icon-search-thin"></i> ')
    $('.dashboard-body').css('min-height', 0)
    $('.dashboard-body').css('padding', '0 20px')
    $(es_search).insertAfter($('.dashboard-body'))

    var esapi = "/custom/Clay/estools/esapi"
    var canStore = false

    var editor = ace.edit($(".ace_editor").get(0), {
        mode: "ace/mode/text"
    })

    setupEditor()

    var eventview = new EventView('.tab-content')
    var timerangedlg = new TimerangeDlg('.shared-timerangepicker')
    timerangedlg.addHandler('setTimerange', function () {
        editor.focus()
    })

    function setupEditor() {
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

        editor.session.on('change', resizeEditor)

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

        setInterval(saveQuery, 500, editor, canStore)
    }

    /*
     * 검색창의 검색문장을 저장한다
     */
    function saveQuery(editor, canStore) {
        if (canStore) {
            localStorage.setItem('discover_history', editor.getValue())
        }
    }

    /*
     * 검색창에서 줄바꿈이 일어나면 검색창 크기를 조정한다
     */
    function resizeEditor() {
        var newHeight =
            editor.getSession().getScreenLength() *
            editor.renderer.lineHeight +
            editor.renderer.scrollBar.getWidth();
        $('pre.ace_editor').height(newHeight.toString() + "px")
        editor.resize();
    }

    function call_api(editor) {
        editor.blur()
        updateEventCount(0)
        var query = editor.getValue().trim()
        query = query.replace(/[\n\r]+/g, ' ');
        var arr = query.split(' ')
        if (arr.length < 2) {
            return
        }
        var bpos = query.indexOf('{')
        var data = ""
        if (bpos > 0) {
            data = query.substring(bpos)
        }
        var queryParam = {
            "method": arr[0],
            "uri": arr[1],
            "data": data
        }

        var defer = $.get(esapi, queryParam)

        defer.done(function (result, status, xhr) {
            if (result['error']) {
                showMessage('Error', result['error'])
                return
            }
            try {
                var jobj = JSON.parse(result);
                if (jobj.hits) {
                    console.log('hits', jobj.hits)
                    updateEventCount(jobj.hits.total.toLocaleString())
                    eventview.render(jobj.hits.hits)
                } else {
                    showMessage('Error', result)
                }
            } catch (e) {
                console.log('err', e)
                console.log('row text', result, status)
            }
        })

        defer.fail(function (xhr) {
            showMessage(xhr.status + ' ' + xhr.statusText, xhr.responseText)
        })
    }

    function updateEventCount(count) {
        $('#tab_events').text(' Events (' + count + ')')
    }

    function showMessage(title, message) {
        var modal = new ModalView({
            title: title,
            message: message
        })
        modal.show()
    }

})