require.config({
    paths: {
        es: "../app/Clay/js/es_search",
        text: "../app/Clay/lib/text"
    }
})

define([
    "jquery",
    "backbone",
    "es_config"
], function (
    $,
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
                        "filter": [{
                            "range": {
                                "@timestamp": {
                                    "gte": "",
                                    "lte": "",
                                    "time_zone": es_config.timezone
                                }
                            }
                        }]
                    }
                },
                "form": 0,
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
                    this.set({
                        'isUserRange': true
                    })
                    q.set({
                        "query": {
                            "bool": {
                                "filter": [{
                                    "range": jo.query
                                }]
                            }
                        }
                    })
                } else {
                    q.get('query.bool').set('must', jo.query)
                }
                return
            }
            // bool 쿼리
            var boolq = jo.query['bool']
            if (this.hasTimerange(boolq['must']) ||
                this.hasTimerange(boolq['should']) ||
                this.hasTimerange(boolq['must_not']) ||
                this.hasTimerange(boolq['filter'])) {
                q.set({
                    "query": {
                        "bool": {
                            "filter": {}
                        }
                    }
                })
                this.set({
                    'isUserRange': true
                })
            }
            q.set({
                "query": {
                    "bool": boolq
                }
            })
        },
        hasTimerange: function (jo) {
            if (!jo) {
                return false
            }
            return (jo['range'] && jo['range']['@timestamp'])
        },
        isUserTimerange: function () {
            return this.get('isUserRange')
        }
    })


    return Query
})