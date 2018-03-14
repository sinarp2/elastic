require.config({
    paths: {
        es: "../app/Clay/js/es_search",
        text: "../app/Clay/lib/text"
    }
})

define([
    "jquery",
    "underscore",
    "backbone",
    "es_config"
], function (
    $,
    _,
    Backbone,
    es_config
) {

        var Query = Backbone.Model.extend({
            initialize: function (attrs) {
                this.tokenize()
            },
            tokenize: function () {
                // 문장 토크나이징
                var text = this.get('qstr')
                var qo = {}
                var tmpArr = text.trim().split(/\s+/).filter(function (e) {
                    return e.trim().length > 0
                })

                if (tmpArr.length < 2) {
                    return
                }

                qo.method = tmpArr[0].toUpperCase()
                qo.uri = tmpArr[1]
                qo.data = '{}'

                var bpos = text.indexOf('{')
                if (bpos > -1) {
                    qo.data = text.substring(bpos)
                }
                qo.index = qo.uri.substring(0, qo.uri.indexOf('_search'))
                // index is '' ot /' or /index*,someindex/ or index*/doc/
                tmpArr = qo.index.split('/')
                qo.index = ''
                for (var i = 0; i < tmpArr.length; i++) {
                    if (tmpArr[i]) {
                        qo.index = tmpArr[i]
                        break
                    }
                }
                try {
                    qo.json = JSON.parse(qo.data)
                } catch (e) {
                    qo.json = null
                }

                var attrs = {
                    'method': qo.method,
                    'uri': qo.uri,
                    'index': qo.index,
                    'data': qo.data,
                    'json': qo.json
                }
                this.set(attrs)
            },
            get_origin: function (jo) {
                var Query = Backbone.Model.extend({})
                return new Query(jo.query)
            },
            get_model: function () {
                var Query = Backbone.Model.extend({})
                var q = new Query({
                    "query": {
                        "bool": {
                            "must": [],
                            "should": [],
                            "must_not": [],
                            "filter": []
                        }
                    },
                    "from": 0,
                    "size": 0,
                    "sort": [{
                        "@timestamp": {
                            "order": "desc"
                        }
                    }]
                })

                var jo = this.get('json')
                if (this.isQueryString(jo)) {
                    // 원문 그대로 만들어 리턴
                    return get_origin(jo)
                }

                this.convertToBoolQuery(jo, q)

                if (jo.sort) {
                    q.set({
                        "sort": jo.sort
                    })
                }

                return q
            },
            validate: function (attrs, options) {
                if (!attrs.method || !attrs.uri || !attrs.json) {
                    return "Invalid query statement."
                }
                if (!attrs.json.query) {
                    return "Query statement not found."
                }
            },
            isQueryString: function (jo) {
                return (jo.query.query_string ||
                    jo.query.simple_query_string ||
                    jo.query.terms_set)
            },
            convertToBoolQuery: function (jo, q) {
                if (!jo.query['bool']) {
                    if (this.hasTimerange(jo.query)) {
                        // range @timestamp 쿼리
                        // "query": {
                        //     "range": {
                        //         "@timestamp": {
                        //         }
                        //     }
                        // }
                        this.set({
                            'isUserRange': true
                        })
                        var o = this.extend_model(q.get("query"), {
                            "bool": {
                                "filter": [{
                                    "range": jo.query
                                }]
                            }
                        })
                        q.set("query", o)
                    } else {
                        // match, match_all, term 쿼리
                        // must에 추가하여 병합한다.
                        var o = this.extend_model(q.get("query"), {
                            "bool": {
                                "must": [
                                    jo.query
                                ]
                            }
                        })
                        q.set("query", o)
                    }
                    return
                }
                // bool 쿼리
                var boolq = jo.query['bool']
                if (this.hasTimerange(boolq['must']) ||
                    this.hasTimerange(boolq['should']) ||
                    this.hasTimerange(boolq['must_not']) ||
                    this.hasTimerange(boolq['filter'])) {
                    var o = this.extend_model(q.get("query"), {
                        "bool": {
                            "filter": []
                        }
                    })
                    q.set("query", o)
                    this.set({
                        'isUserRange': true
                    })
                }
                var o = this.extend_model(q.get("query"), {
                    "bool": boolq
                })
                console.log('query', o)
                q.set("query", o)
            },
            hasTimerange: function (jo) {
                if (!jo) {
                    return false
                }
                if (_.isArray(jo)) {
                    var range = _.find(jo, function (jo) {
                        return (jo['range'] && jo['range']['@timestamp'])
                    })
                    return range
                } else {
                    return (jo['range'] && jo['range']['@timestamp'])
                }
            },
            isUserTimerange: function () {
                return this.get('isUserRange')
            },
            extend_model: function (obj1, obj2) {
                return $.extend(true, {}, obj1, obj2)
            },
            setTimerange: function (qo, gte, lte, latest_time) {
                if (this.isUserTimerange()) {
                    return
                }
                var range = {
                    "range": {
                        "@timestamp": {
                            "gte": gte,
                            "time_zone": "+00:00"
                        }
                    }
                }
                if (_.isString(latest_time) && latest_time.indexOf("@") > -1) {
                    range["range"]["@timestamp"]["lt"] = lte
                } else {
                    range["range"]["@timestamp"]["lte"] = lte
                }
                qo.get("query")["bool"]["filter"].push(range)
            },
            setFrom: function (qo, page) {
                var size = this.get("size")
                qo.set("size", size)
                qo.set("from", (page - 1) * size + 1)
            }
        })

        return Query
    })