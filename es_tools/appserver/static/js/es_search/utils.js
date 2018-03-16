define([
    "underscore",
    "moment",
    "es_config"
], function (
    _,
    moment,
    es_config
) {

    return {
        epoch: epoch,
        sp_modify: sp_modify,
        histo_interval: histo_interval,
        get_timerange: get_timerange
    }

    function get_timerange(filter) {
        var ts, gte, lte
        if (_.isArray(filter)) {
            _.find(filter, function (obj) {
                if (obj.range) {
                    ts = obj.range['@timestamp']
                    return true
                }
            })
        } else {
            ts = filter.range['@timestamp']
        }
        gte = ts.gte || ts.gt
        lte = ts.lte || ts.lt
        return {
            gte: gte,
            lte: lte
        }
    }

    function histo_interval(ts) {
        var r = ts.lte - ts.gte
        var ux = [1000, 60, 60, 24, 30, 12]
        var ul = ['1s', '1m', '1h', '1d', '1M', '1y']
        var max = 240
        for (var i = 0; i < ux.length; i++) {
            r = parseInt(r / ux[i]) || 1
            if (r <= max) {
                return ul[i]
            }
        }
    }

    function epoch(val, mod) {
        if (!val) {
            return moment().unix()
        }
        if (val < 0) {
            return moment().subtract(Math.abs(val), mod).unix()
        } else {
            return moment().add(val, mod).unix()
        }
    }

    function es_modify(input) {
        return moment(input)
    }

    function sp_modify(mod) {
        if (!mod) {
            return null
        }
        if (_.isNumber(mod)) {
            return mod * 1000
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
        var match = mod.match(/([-|\+]?)([0-9]+)([a-z]+)($|@[a-z]+)/)
        if (!match) {
            return null
        }
        var plus_minus = match[1]
        var num = match[2]
        var unit = match[3]
        var round = match[4]
        try {
            return convert(plus_minus, num, unit, round)
        } catch (e) {
            console.log('convert error', e)
            return moment().valueOf()
        }
    }

    function convert(plus_minus, num, unit, round) {
        console.log('convert', plus_minus, num, unit, round)
        var timestamp = 0
        if (num && unit) {
            unit = unit.replace('mon', 'M')
            if (plus_minus === '-') {
                timestamp = moment().subtract(num, unit).valueOf()
            } else {
                timestamp = moment().add(num, unit).valueOf()
            }
        } else {
            timestamp = moment().valueOf()
        }

        if (round) {
            round = round.replace('@', '')
            round = round.replace('d', 'D')
            round = round.replace('mon', 'M')
            var m = moment(timestamp)
            var round_pattern = ['ms', 's', 'm', 'h', 'D', 'M', 'y']
            var round_start = {
                'ms': 0,
                's': 0,
                'm': 0,
                'h': 0,
                'D': 1,
                'M': 0
            }
            _.find(round_pattern, function (pattern) {
                if (round !== pattern) {
                    console.log(pattern)
                    m = m.set(pattern, round_start[pattern])
                    return false
                }
                return true
            })
            return m.valueOf()
        }
        return timestamp
    }
})