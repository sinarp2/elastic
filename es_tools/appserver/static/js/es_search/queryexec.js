define(["jquery", "underscore", "backbone", "moment"], function ($, _, Backbone, moment) {

    var ESAPI_URL = "/custom/Clay/estools/esapi"

    return {
        doGet: doGet,
        hitsQuery: hitsQuery,
        fieldsQuery: fieldsQuery,
        timelineQuery: timelineQuery,
        tokenizeQuery: tokenizeQuery,
        buildQuery: buildQuery
    }

    function hitsQuery(params) {
        var q = $.Deferred()
        var p = doGet(params)
        p.done(function(res, status, xhr) {
            var jo = {}
            try {
                jo = JSON.parse(res)
                if (!jo.hits) {
                    throw jo
                }
                if (jo.hits.total === 0) {
                    throw 'No results found. Try expanding the time range.'
                }
            } catch (e) {
                q.reject(e, res)
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
        p.done(function(res, status, xhr) {
            var jo = {}
            try {
                jo = JSON.parse(res)
            } catch (e) {
                console.log('json parsing error', e, status, res, xhr)
                q.reject(e, res)
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

    function tokenizeQuery(text) {
        var tmpArr = text.trim().split(/\s+/).filter(function (e) { return e.trim().length > 0 })
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
        return qo
    }

    function buildQuery(qo, timerange, page) {
        console.log('buildQuery', timerange)
        var jo = {}
        try {
            jo = JSON.parse(qo.data)
        } catch (e) {
            throw e
        }
        var size = (qo["size"]) ? qo["size"] : 10
        jo["from"] = (page - 1) * size + 1
        jo["size"] = size

        var range = {
            "range": {
                "@timestamp": {
                    "gte": timerange.gte,
                    "lte": timerange.lte,
                    "time_zone": "+09:00"
                }
            }
        }
        if (!jo.query) {
            jo['query'] = range
        } else if (jo.query.query_string ||
            jo.query.simple_query_string ||
            jo.query.terms_set) {
            // Timerange 기능 disable
            // 원 검색문 그대로 리턴
        } else if (jo.query.range && jo.query.range["@timestamp"]) {
            // range @timestamp 쿼리
            // Timerange 기능 disable
            // 원 검색문 그대로 리턴
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
        qo.from = jo.from
        qo.size = jo.size
        return qo
    }

    function checkResultData(data) {
        var result = {
            status: 'OK',
            data: null
        }
        try {
            var jo = JSON.parse(data);
            if (jo.hits) {
                result.data = jo
            } else {
                result.status = 'NO'
                result.data = jo
            }
        } catch (e) {
            result.status = 'NO'
            result.data = e
        }
        return result
    }
})