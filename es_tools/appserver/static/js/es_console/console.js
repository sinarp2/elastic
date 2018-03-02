require.config({
    paths: {
        text: "../app/Clay/lib/text",
        split: "../app/Clay/js",
        ace: "../app/Clay/js/ace",
        ess: "../app/Clay/js/es_search"
    }
})

define([
    "jquery",
    "underscore",
    "backbone",
    'split/split.min',
    "ace/ace",
    "ess/queryexec",
    "text!../app/Clay/html/es_console.html"
], function (
    $,
    _,
    Backbone,
    Split,
    ace,
    QueryExec,
    template) {

        var view = Backbone.View.extend({

            "initialize": function () {
                var vm = this
                // Before to render, load saved data
                var tmp = getLocalStorage('splitSize') || "50, 50"
                tmp = tmp.split(',')
                vm.splitSize = [Number(tmp[0]), Number(tmp[1])]
                vm.history = getLocalStorage('history') || ''

                $(window).resize(_.debounce(function (e) {
                    vm.isDragging = true
                }, 250, true)).resize(_.debounce(function (e) {
                    vm.isDragging = false
                }, 250, false))

                vm.render()
            },
            "render": function () {

                var vm = this

                $(template).insertAfter(vm.$el)

                $('.floating-menu').hide()
                $('.exec-query').click(function () {
                    callApi(vm.editor1, vm.editor2)
                })

                var split = Split(['#one', '#two'], {
                    sizes: vm.splitSize,
                    minSize: 330,
                    onDrag: function () {
                        vm.isDragging = true
                        vm.editor1.resize()
                        vm.editor2.resize()
                    },
                    onDragEnd: function () {
                        vm.isDragging = false
                        setLocalStorage('splitSize', vm.split.getSizes())
                    }
                })

                var editor1 = ace.edit("one", {
                    mode: "ace/mode/json"
                })

                var editor2 = ace.edit("two", {
                    mode: "ace/mode/json",
                })

                editor1.setOptions({
                    wrap: true
                })
                // editor2.setOptions({
                //     wrap: true
                // })

                editor1.setValue(vm.history, -1)
                editor1.setShowPrintMargin(false);
                editor2.setShowPrintMargin(false);
                editor1.$blockScrolling = Infinity
                editor2.$blockScrolling = Infinity

                editor1.commands.addCommand({
                    name: "executeQuery",
                    bindKey: {
                        win: "Ctrl-Enter",
                        mac: "Command-Return"
                    },
                    exec: function (ed) {
                        callApi(vm.editor1, vm.editor2)
                    }
                })

                editor1.session.on('change', _.debounce(function (e) {
                    setLocalStorage('history', editor1.getValue())
                }, 230))

                editor1.session.on('changeScrollTop', _.debounce(function (e) {
                    vm.isDragging = true
                }, 230, true))
                editor1.session.on('changeScrollTop', _.debounce(function (e) {
                    vm.isDragging = false
                }, 230, false))

                vm.split = split
                vm.editor1 = editor1
                vm.editor2 = editor2

                vm.finitState(null)

            },
            "finitState": function (pState) {
                var vm = this
                setTimeout(function () {
                    pState = displayExecIcon(vm.editor1, vm.isDragging, pState)
                    vm.finitState(pState)
                }, 100)
            }
        })

        function getLocalStorage(name) {
            if (typeof (Storage) !== "undefined") {
                return localStorage.getItem(name)
            }
            return null
        }

        function setLocalStorage(name, value) {
            if (typeof (Storage) !== "undefined") {
                localStorage.setItem(name, value)
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
            query = query.trim()
            query = query.replace(/[\n\r]+/g, ' ');

            var arr = query.split(/(\s+)/).filter(function (e) { return e.trim().length > 0 })
            console.log('arr', arr)
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

        function callApi(ed1, ed2) {
            var queryParam = findQueryStatement(ed1)
            ed2.setValue('', -1)
            if (!queryParam) {
                return
            }
            // console.log(queryParam)
            if (queryParam.uri.startsWith('/')) {
                queryParam.uri = queryParam.uri.substring(1)
            }

            QueryExec.doGet(queryParam).done(function (data, status, xhr) {
                try {
                    var jobj = JSON.parse(data);
                    ed2.setValue(JSON.stringify(jobj, undefined, 2), -1)
                } catch (e) {
                    ed2.setValue(data, -1)
                }
                ed2.session.setUseWrapMode(true)
            })
        }

        function displayExecIcon(editor, isDragging, pState) {

            if (isDragging || !editor) {
                $('.floating-menu').hide()
                return null
            }
            // 이전 상태와 비교하여 변경된 경우 만 적용
            if (pState) {
                pState.count = (pState.cpos === editor.getCursorPosition().row) ? pState.count + 1 : 0
                if (pState.count > 2) {
                    pState.count = pState.count - 1
                    return pState
                }
            }
            var block = getQueryBlock(editor)
            if (!block) {
                pState = block
                $('.floating-menu').fadeOut('slow')
                return pState
            }
            var cnt = (pState) ? pState.count || 0 : 0
            pState = block
            pState.count = cnt

            var $aln = $('.ace_active-line')
            var $div = $('.gutter.gutter-horizontal')
            var $scr = $('.ace_scrollbar.ace_scrollbar-v')
            var $fmn = $('.floating-menu')
            var top = $aln.offset().top - ($aln.height() * (block.cpos - block.bpos))

            top = (top < $scr.offset().top) ? $scr.offset().top + 5 : top

            $fmn.offset({
                top: top,
                left: $aln.offset().left + $aln.width() - $scr.width() - 5
            });
            
            $fmn.fadeIn()
            
            return pState
        }

        function getQueryBlock(editor) {
            var text = editor.getValue()
            var pos = editor.getCursorPosition().row

            if (!text) {
                return null
            }
            // console.log('text', text)
            var arr, line, bpos, epos
            arr = text.split('\n')
            for (var i = 0; i < arr.length; i++) {
                arr[i] = arr[i].trim()
            }
            // console.log('epos1', epos)
            // console.log('arr', arr)
            // 커서 이전 블록 검색
            for (var i = pos; i > -1; i--) {
                line = arr[i].toUpperCase()
                // console.log('line', line)
                if (line.indexOf('GET') === 0 ||
                    line.indexOf('PUT') === 0 ||
                    line.indexOf('POST') === 0 ||
                    line.indexOf('DELETE') === 0 ||
                    line.indexOf('HEAD') === 0) {
                    bpos = i
                    break
                }
            }

            // console.log('epos2', epos)
            // 커서 이후 블록 검색
            var isEmpty = true
            for (var i = pos; i < arr.length; i++) {
                line = arr[i].toUpperCase()
                // console.log('line after', line)
                if (line.indexOf('GET') === 0 ||
                    line.indexOf('PUT') === 0 ||
                    line.indexOf('POST') === 0 ||
                    line.indexOf('DELETE') === 0 ||
                    line.indexOf('HEAD') === 0) {
                    epos = i
                    break
                }
                if (line) {
                    isEmpty = false
                }
            }
            // console.log('epos', epos)

            if (isEmpty && bpos !== epos) {
                return null
            }
            if (!epos) {
                // console.log('epos', epos)
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
                epos: epos,
                cpos: pos
            }
        }

        return view

    })