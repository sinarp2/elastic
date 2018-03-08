define(["jquery", "underscore", "backbone", "moment"], function ($, _, Backbone, moment) {

    var ESAPI_URL = "/custom/Clay/estools/esapi"

    return {
        doGet: doGet,
        hitsQuery: hitsQuery,
        fieldsQuery: fieldsQuery,
        timelineQuery: timelineQuery,
        getQueryObject: getQueryObject,
        applyTimeRange: applyTimeRange,
        applyPagination: applyPagination
    }

    function hitsQuery(params) {
        var q = $.Deferred()
        var p = doGet(params)
        p.done(function (res, status, xhr) {
            var jo = {}
            try {
                jo = JSON.parse(res)
                if (!jo.hits) {
                    q.reject(jo)
                    return
                }
            } catch (e) {
                q.reject(e, res)
                return
            }
            q.resolve(jo, status, xhr)
        })
        return q.promise()
    }

    function fieldsQuery(params) {
        params.uri = params.index || '_all'
        params.uri = params.uri + '/_mappings'
        params.data = ''

        var q = $.Deferred()
        var p = doGet(params)
        p.done(function (res, status, xhr) {
            var jo = {}
            try {
                jo = JSON.parse(res)
            } catch (e) {
                console.log('json parsing error', e, status, res, xhr)
                q.reject(e, res)
                return
            }
            q.resolve(jo, status, xhr)
        })
        return q.promise()
    }

    function timelineQuery(params) {

        // Timerange 적용 여부
        // query_string, simple_query_string, range 쿼리는 Timerange 값을 사용하지 않는다.
        // 때문에 timerange 값으로 aggregation 할 수 없음.
        return doGet(params)
    }

    function doGet(params) {
        return $.ajax(ESAPI_URL, {
            data: params
        })
    }

    function getQueryObject(text) {
        // 문장 토크나이징
        var tmpArr = text.trim().split(/\s+/).filter(function (e) {
            return e.trim().length > 0
        })
        var qo = {}

        if (tmpArr.length < 2) {
            return null
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

        return qo
    }

    function applyPagination(qo, page) {
        var size = (qo["size"]) ? qo["size"] : 10
        qo.json.from = (page - 1) * size + 1
        qo.json.size = size
        qo.json.sort = {
            "@timestamp": "asc"
        }
        qo.data = JSON.stringify(qo.json)
        qo.from = qo.json.from
        qo.size = qo.json.size
        return qo
    }

    function applyTimeRange(qo, timerange) {

        /**
         * qo.data to json object
         * applyTimeRange
         *      - aggregation 일단 무시 -> query 문장 없이도 aggregation 할 수 있으므로
         *          일단 query 문장은 있다고 가정함.
         *      - if not query then convert to bool query
         *      - find filter context and check has timerange condition
         *      - 필터에 적용하기전 must 또는 should에 Timerange 조건이 있다면?
         *      - query_string 또는 simple_query 인 경우 Timerange를 
         *          All Time으로 설정하면 자체적인 시간 설정이 가능함.
         * set from size
         */
        console.log('applyTimeRange -> timerange', timerange)

        var range = {
            "range": {
                "@timestamp": {
                    "gte": timerange.gte,
                    "lte": timerange.lte,
                    "time_zone": timerange.timezone
                }
            }
        }

        if (!timerange.gte) {
            range['range']['@timestamp'] = _.omit(range['range']['@timestamp'], "gte")
        }

        if (!timerange.lte) {
            range['range']['@timestamp'] = _.omit(range['range']['@timestamp'], "lte")
        }

        var tmpl = {
            "query": {
                "bool": {
                    "must": [],
                    "should": [],
                    "must_not": [],
                    "filter": []
                },
                "form": 0,
                "size": 0
            }
        }

        /**
         * bool 쿼리로 전환 
         * 
         */
        var jo = qo.json

        if (!timerange.gte && !timerange.lte) {
            // All time
            // 날짜 설정하지 않음.
        } else if (!jo.query) {
            // query 속성이 없으면 단수 range 쿼리문으로
            jo['query'] = range
        } else if (jo.query.query_string ||
            jo.query.simple_query_string ||
            jo.query.terms_set) {
            // Timerange 기능 disable
            // 원 검색문 그대로 리턴
            console.log('buildQuery -> query_string query', jo)
        } else if (jo.query.range) {
            if (!jo.query.range["@timestamp"]) {
                // range @timestamp 쿼리
                // Timerange 기능 disable
                // 원 검색문 그대로 리턴)
                var ro = jo.query.range
                if (_.isArray(ro)) {

                }
                Backbone.Events.trigger('setUserTimerange', _.clone(jo.query.range))
            }
        } else if (!jo.query.bool) {
            // match, match_all, terms ...
            var oldQuery = jo.query
            jo.query = {
                "bool": {
                    "filter": range
                }
            }
            jo.query.bool["must"] = oldQuery
        } else if (jo.query.bool && !jo.query.bool.filter) {
            jo.query.bool["filter"] = range
        } else if (jo.query.bool && jo.query.bool.filter) {
            var fo = jo.query.bool.filter
            if (_.isArray(fo)) {
                var hasRange = _.find(fo, function (o) {
                    return (o.range && o.range["@timestamp"])
                })
                if (!hasRange) {
                    fo.push(range)
                }
            } else {
                var old = fo
                if (!fo.range || !fo.range["@timestamp"]) {
                    fo = [old, range]
                }
            }
        }
        qo.data = JSON.stringify(jo)
        qo.json = jo
        return qo
    }
})