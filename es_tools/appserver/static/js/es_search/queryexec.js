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
        var arr = text.trim().split(/\s+/)
        var qo = {}

        if (arr.length < 2) {
            return null
        }
        qo.method = arr[0].toUpperCase()
        qo.uri = arr[1]
        qo.data = '{}'

        var bpos = text.indexOf('{')
        if (bpos > -1) {
            qo.data = text.substring(bpos)
        }
        qo.index = qo.uri.replace('_search', '').replace('/', '')

        return qo
    }

    function rebuildQuery(data, timerange, page) {
        var jo = JSON.parse(data)
        var size = (jo['size']) ? jo['size'] : 10
        jo['from'] = (page - 1) * size + 1
        jo['size'] = size
        if (!jo.query) {
            jo['query'] = {
                "range": {
                    "@timestamp": {
                        "gte": "2017-11-22T00:05:50.000Z",
                        "lte": timerange.lte,
                        "time_zone": "+09:00"
                    }
                }
            }
        } else if (!jo.query.bool) {
            var oldQuery = jo.query
            jo.query = {
                "bool": {
                    "filter": {
                        "range": {
                            "@timestamp": {
                                "gte": "2017-11-22T00:05:50.000Z",
                                "lte": timerange.lte,
                                "time_zone": "+09:00"
                            }
                        }
                    }
                }
            }
            jo.query.bool["must"] = oldQuery
        }
        console.log('buildquery', jo)
        return JSON.stringify(jo)
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