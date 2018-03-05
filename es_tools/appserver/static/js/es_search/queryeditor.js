require.config({
    paths: {
        text: "../app/Clay/lib/text"
    }
})

define([
    "jquery",
    "underscore",
    "backbone",
    "text!../app/Clay/html/es_queryeditor.html"
], function ($, _, Backbone, template) {

    var view = Backbone.View.extend({
        "initialize": function () {
            this.render();
        },
        "getValue": function () {
            return this.editor.getValue()
        },
        "events": {
            'click .search-button > a.btn': function () {
                onEnterEditor(this.editor)
            }
        },
        "render": function () {
            this.$el.html(_.template(template, {}));
            this.setupEditor()
            return this
        },
        "setupEditor": function () {

            var editor = ace.edit($(".ace_editor").get(0), {
                mode: "ace/mode/text"
            })

            Backbone.Events.on('execQuery', function () {
                editor.blur()
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
                exec: onEnterEditor
            })

            editor.session.on('change', function (e) {
                resizeEditor(editor)
            })

            editor.on('focus', function () {
                $('.ace_editor').addClass('focused')
            })

            editor.on('blur', function () {
                $('.ace_editor').removeClass('focused')
            })

            editor.focus()

            if (typeof (Storage) !== "undefined") {
                this.canStore = true
                if (localStorage.discover_history) {
                    editor.setValue(localStorage.discover_history, -1)
                }
            } else {
                this.canStore = false
            }

            setInterval(saveQuery, 500, editor, this.canStore)
            this.editor = editor
        }
    })

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
    function resizeEditor(editor) {
        var newHeight =
            editor.getSession().getScreenLength() *
            editor.renderer.lineHeight +
            editor.renderer.scrollBar.getWidth();
        $('pre.ace_editor').height(newHeight.toString() + "px")
        editor.resize();
    }

    function onEnterEditor(editor) {
        Backbone.Events.trigger('execQuery', 1, true)
    }

    return view
})