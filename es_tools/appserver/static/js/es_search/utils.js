define(["underscore", "moment"], function (_, moment) {

    var roundPattern = {
        "@y": "YYYY-01-01T00:00:00+00:00",
        "@mon": "YYYY-MM-01T00:00:00+00:00",
        "@d": "YYYY-MM-DDT00:00:00+00:00",
        "@h": "YYYY-MM-DDThh:00:00+00:00",
        "@m": "YYYY-MM-DDThh:mm:00+00:00",
        "@s": "YYYY-MM-DDThh:mm:ss+00:00",
        "@w0": "YYYY-MM-DDT00:00:00+00:00",
        "@w1": "YYYY-MM-DDT00:00:00+00:00",
        "none": "YYYY-MM-DDThh:mm:ss+00:00"
    }

    return {
        spModify: spModify,
        esModify: esModify,
        now: now,
        unix: unix,
        timelineInterval: timelineInterval
    }

    function timelineInterval(data) {
        var filter = data['query']['bool']['filter']
        var ts, gte, lte, gap
        if (_.isArray(filter)) {
            _.find(filter, function (obj) {
                if (obj['range']) {
                    ts = obj['range']['@timestamp']
                    return true
                }
            })
        } else {
            ts = filter['range']['@timestamp']
        }
        gte = ts['gte'] || ts['gt']
        lte = ts['lte'] || ts['lt']
        gap = moment(gte).diff(moment(lte), 'days')
        console.log('time gap', gap, gte, lte)
        return '1d'
    }

    function unix(num) {
        return moment(num * 1000).format()
    }

    function now(formatString) {
        return moment().format(formatString)
    }

    function esModify(input) {
        return moment(input)
    }

    function spModify(mod) {
        if (!mod) {
            return null
        }
        if (_.isNumber(mod)) {
            return moment(mod * 1000).utc().format()
        }
        if (mod === 'now' || mod === 'rt' || mod === 'rtnow') {
            return moment().utc().format()
        }
        if (mod.indexOf('rt') === 0) {
            mod = mod.substring(2)
        }
        if (mod.indexOf('@') === 0) {
            return convert(null, null, null, mod)
        }
        var match = mod.match(/(-|\+)(\d+)(mon|[ydhmsw])($|@mon|@[ydhmsw]|@w[0-7])$/)
        if (!match) {
            return null
        }
        var plus_minus = match[1]
        var num = match[2]
        var unit = match[3]
        var round = match[4] || 'none'
        try {
            return convert(plus_minus, num, unit, round)
        } catch (e) {
            console.log('convert error', e)
            return null
        }
    }

    function convert(plus_minus, num, unit, round) {
        console.log('convert:', plus_minus, num, unit, round)
        if (num && unit) {
            if (plus_minus === '-') {
                return moment().subtract(num, unit).format(roundPattern[round])
            } else {
                return moment().add(num, unit).format(roundPattern[round])
            }
        }
        if (!num && !unit && round) {
            if (round.indexOf('@w') === 0) {
                var day = parseInt(round.substring(2))
                return moment().weekday(day).format(roundPattern[round])
            }
            return moment().format(roundPattern[round])
        }
        return null
    }
})