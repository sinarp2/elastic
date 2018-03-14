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
            "@y": "YYYY-01-01T00:00:00.000",
            "@mon": "YYYY-MM-01T00:00:00.000",
            "@d": "YYYY-MM-DDT00:00:00.000",
            "@h": "YYYY-MM-DDThh:00:00.000",
            "@m": "YYYY-MM-DDThh:mm:00.000",
            "@s": "YYYY-MM-DDThh:mm:ss.000",
            "@w0": "YYYY-MM-DDT00:00:00.000",
            "@w1": "YYYY-MM-DDT00:00:00.000",
            "none": "YYYY-MM-DDThh:mm:ss.000"
        }

        _.each(roundPattern, function (val, key) {
            val = val + es_config.timezone
        })

        return {
            sp_modify: sp_modify,
            histo_interval: histo_interval,
            get_timerange: get_timerange
        }

        function get_timerange(filter) {
            var ts, gte, lte
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
            return {
                gte: gte,
                lte: lte
            }
        }

        function histo_interval(ts) {
            var gte, lte, gap, interval
            gte = ts.gte
            lte = ts.lte
            gap = (lte - gte) / 60 / 60 / 1000
            if (gap < 24) {
                interval = '1h'
            } else if (23 < gap && gap < (60 * 24)) {
                interval = '1d'
            } else if (gap > (60 * 24)) {
                interval = '1M'
            } else {
                interval = 'month'
            }
            return interval
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
                    return moment(moment().subtract(num, unit).format(roundPattern[round])).valueOf()
                } else {
                    return moment(moment().add(num, unit).format(roundPattern[round])).valueOf()
                }
            }
            if (!num && !unit && round) {
                if (round.indexOf('@w') === 0) {
                    var day = parseInt(round.substring(2))
                    return moment(moment().weekday(day).format(roundPattern[round])).valueOf()
                }
                return moment(moment().format(roundPattern[round])).valueOf()
            }
            return null
        }
    })