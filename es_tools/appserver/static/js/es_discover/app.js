require.config({
    paths: {
        split: "../app/Clay/js",
        ace: "../app/Clay/js/es_console/ace"
    }
});

require([
    "jquery",
    'split/split.min',
    "ace/ace",
    "ace/keyboard/hash_handler",
    'splunkjs/mvc/simplexml/ready!'
], function (
    $,
    Split,
    ace,
    HashHandler
) {

    var esapi = "/custom/Clay/estools/esapi"
    var canStore = false

    function saveQuery(editor, canStore) {
        if (canStore) {
            localStorage.setItem('history', editor.getValue())
        }
    }

    function displayExecIcon(editor) {
        if (editor.isFocused()) {
            var block = getQueryBlock(editor)
            var fm = $('.floating-menu')
            if (!block) {
                fm.fadeOut('slow')
                return
            }
            var cells = $('#one').find('div.ace_gutter-cell')
            var content = $('#one').find('div.ace_content')
            var cell = cells[block.bpos]
            fm.offset({
                top: $(cell).offset().top,
                left: content.width() + content.offset().left - fm.width() - 4
            });
            fm.fadeIn(3000)
        }
    }

    function getQueryBlock(editor) {
        var text = editor.getValue()
        if (!text) {
            return null
        }
        var pos = editor.getCursorPosition().row
        var arr, line, bpos, epos
        arr = text.split('\n')
        for (var i = 0; i < arr.length; i++) {
            arr[i] = arr[i].trim()
        }

        // 커서 이전 블록 검색
        for (var i = pos; i > -1; i--) {
            line = arr[i].toUpperCase()
            if (line.indexOf('GET') > -1 ||
                line.indexOf('PUT') > -1 ||
                line.indexOf('POST') > -1 ||
                line.indexOf('DELETE') > -1 ||
                line.indexOf('HEAD') > -1) {
                bpos = i
                break
            }
        }

        // 커서 이후 블록 검색
        var isEmpty = true
        for (var i = pos; i < arr.length; i++) {
            line = arr[i].toUpperCase()
            if (line.indexOf('GET') > -1 ||
                line.indexOf('PUT') > -1 ||
                line.indexOf('POST') > -1 ||
                line.indexOf('DELETE') > -1 ||
                line.indexOf('HEAD') > -1) {
                epos = i
                break
            }
            if (line) {
                isEmpty = false
            }
        }

        if (isEmpty && bpos !== epos) {
            return null
        }
        if (!epos) {
            for (var i = arr.length - 1; i > -1; i--) {
                if (arr[i].trim()) {
                    epos = i + 1
                    break
                }
            }
        }
        return {
            arr: arr,
            bpos: bpos,
            epos: epos
        }
    }

    function findQueryStatement(editor) {
        var block = getQueryBlock(editor)
        if (!block) {
            return null
        }

        if (block.bpos === block.epos) {
            block.epos += 1
        }
        var query = block.arr.slice(block.bpos, block.epos).join('\n')
        query = query.replace(/[\n\r]+/g, ' ');

        var arr = query.split(' ')
        if (arr.length < 2) {
            return null
        }
        var bpos = query.indexOf('{')
        var data = ""
        if (bpos > 0) {
            data = query.substring(bpos)
        }

        return {
            "method": arr[0],
            "uri": arr[1],
            "data": data
        }
    }

    function call_api(editor) {
        var queryParam = findQueryStatement(editor)
        if (!queryParam) {
            editor2.setValue("", -1)
            return
        }
        if (queryParam.uri.startsWith('/')) {
            queryParam.uri = queryParam.uri.substring(1)
        }
        //console.log('query', queryParam)
        $.get(esapi, queryParam, function (data, status, xhr) {
            try {
                var jobj = JSON.parse(data);
                editor2.setValue(JSON.stringify(jobj, undefined, 2), -1)
            } catch (e) {
                editor2.setValue(data, -1)
            }
            editor2.session.setUseWrapMode(true)
        })
    }

    Split(['#one', '#two'], {
        sizes: [50, 50],
        minSize: 200
    })

    var editor1 = ace.edit("one", {
        mode: "ace/mode/json"
    })
    var editor2 = ace.edit("two", {
        mode: "ace/mode/json"
    })

    editor1.setShowPrintMargin(false);
    editor2.setShowPrintMargin(false);
    editor1.$blockScrolling = Infinity
    editor2.$blockScrolling = Infinity

    $('.floating-menu').hide('fast')

    // editor1.session.on('change', function (delta, esess) {

    // })

    // var keyboardHandler = new HashHandler.HashHandler();
    // var ua = window.navigator.userAgent.toUpperCase();
    // console.log('ua', ua)
    // if (ua.indexOf("MAC OS X")) {
    //     keyboardHandler.bindKeys({
    //         "Command-Return": call_api
    //     })
    // } else {
    //     keyboardHandler.bindKeys({
    //         "Ctrl-Enter": call_api
    //     })
    // }
    // editor1.keyBinding.addKeyboardHandler(keyboardHandler)
    editor1.commands.addCommand({
        name: "executeQuery",
        bindKey: {
            win: "Ctrl-Enter",
            mac: "Command-Return"
        },
        exec: call_api
    })

    if (typeof (Storage) !== "undefined") {
        canStore = true
        if (localStorage.history) {
            editor1.setValue(localStorage.history, -1)
        }
    } else {
        canStore = false
    }

    setInterval(saveQuery, 500, editor1, canStore)
    setInterval(displayExecIcon, 500, editor1)

    $('.exec-query').click(function() {
        call_api(editor1)
    })
})