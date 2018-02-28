define(["jquery", "underscore", "backbone", "moment"], function ($, _, Backbone, moment) {

    var ESAPI_URL = "/custom/Clay/estools/esapi"

    return {
        simpleQuery: simpleQuery
    }

    function simpleQuery(text, page) {
        page = page || 1
        var deferred = $.Deferred()
        var params = getQueryParams(text, page)

        $.ajax(ESAPI_URL, {
            data: params
        }).done(function (res, status, xhr) {
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

    function getQueryParams(text, page) {
        query = text.trim().replace(/[\n\r]+/g, ' ');
        var arr = query.split(' ')
        if (arr.length < 2) {
            return
        }
        var bpos = query.indexOf('{')
        var data = ""
        if (bpos > 0) {
            data = query.substring(bpos)
        }

        var from = 1
        // 페이지 처리
        try {
            var jo = JSON.parse(data)
            var size = (jo['size']) ? jo['size'] : 10
            jo['from'] = (page - 1) * size + 1
            jo['size'] = size
            from = jo['from']
            data = JSON.stringify(jo)
        } catch (e) {
            // skip
            console.log('not json object', e)
        }
        // 페이지 처리

        return {
            "method": arr[0],
            "uri": arr[1],
            "data": data,
            "from": from
        }
    }
})