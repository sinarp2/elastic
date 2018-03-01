define(["jquery", "underscore", "backbone", "moment"], function ($, _, Backbone, moment) {

    var ESAPI_URL = "/custom/Clay/estools/esapi"

    return {
        simpleQuery: simpleQuery,
        tokenizeQuery: tokenizeQuery,
        rebuildQuery: rebuildQuery
    }

    function simpleQuery(params) {
        var deferred = $.Deferred()

        $.ajax(ESAPI_URL, {
            data: params
        }).done(function (res, status, xhr) {
            console.log('xhr', this)
            var jo = checkResultData(res)
            if (jo.status === 'OK') {
                deferred.resolve(jo.data, params.from)
            } else {
                deferred.reject(jo.data)
            }
        }).fail(function (res) {
            deferred.reject(res.data)
        }).always(function (res) {
            //console.log('always', res)
        })

        return deferred.promise()
    }

    function tokenizeQuery(text) {
        var tmpArr = text.trim().split(/\s+/)
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

    function rebuildQuery(qo, timerange, page) {
        var jo = {}
        try {
            jo = JSON.parse(qo.data)
        } catch (e) {
            throw e
        }
        var size = (jo["size"]) ? jo["size"] : 10
        jo["from"] = (page - 1) * size + 1
        jo["size"] = size

        var range = {
            "range": {
                "@timestamp": {
                    "gte": "2017-11-22T00:05:50.000Z",
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