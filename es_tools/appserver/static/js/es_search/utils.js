define([
    "underscore",
    "moment",
    "es_config"
], function (
    _,
    moment,
    es_config
) {

    var roundPattern = {
        "@y": "YYYY-01-01T00:00:00.000+00:00",
        "@mon": "YYYY-MM-01T00:00:00.000+00:00",
        "@d": "YYYY-MM-DDT00:00:00.000+00:00",
        "@h": "YYYY-MM-DDThh:00:00.000+00:00",
        "@m": "YYYY-MM-DDThh:mm:00.000+00:00",
        "@s": "YYYY-MM-DDThh:mm:ss.000+00:00",
        "@w0": "YYYY-MM-DDT00:00:00.000+00:00",
        "@w1": "YYYY-MM-DDT00:00:00.000+00:00",
        "none": "YYYY-MM-DDThh:mm:ss.000+00:00"
    }

    return {
        sp_modify: sp_modify,
        now_utc_epoch: now_utc_epoch,
        get_timezone: get_timezone,
        timelineInterval: timelineInterval
    }

    function get_timezone() {
        return es_config.timezone || "+00:00"
    }

    function timelineInterval(filter) {
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
        gap = (lte - gte) / 60 / 60
        if (gap < 24) {
            return '1m'
        } else if (23 < gap < 4380) {
            return '1d'
        } else if (gap > 4380) {
            return 'month'
        }
    }

    function now_utc_epoch(millis) {
        if (millis) {
            return moment().valueOf()
        } else {
            return moment().unix()
        }
    }

    function esModify(input) {
        return moment(input)
    }

    function sp_modify(mod) {
        if (!mod) {
            return null
        }
        if (_.isNumber(mod)) {
            return mod
        }
        if (mod === 'now' || mod === 'rt' || mod === 'rtnow') {
            return moment().valueOf()
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
        if (num && unit) {
            if (plus_minus === '-') {
                return moment(moment().utc().subtract(num, unit).format(roundPattern[round])).valueOf()
            } else {
                return moment(moment().utc().add(num, unit).format(roundPattern[round])).valueOf()
            }
        }
        if (!num && !unit && round) {
            if (round.indexOf('@w') === 0) {
                var day = parseInt(round.substring(2))
                return moment(moment().utc().weekday(day).format(roundPattern[round])).valueOf()
            }
            return moment(moment().utc().format(roundPattern[round])).valueOf()
        }
        return null
    }
})