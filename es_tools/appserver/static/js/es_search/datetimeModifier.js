define(["moment"], function (moment) {
    "use strict";

    function DatetimeModifier() {
        if (!(this instanceof DatetimeModifier)) {
            throw new TypeError("DatetimeModifier constructor cannot be called as a function.");
        }
    }

    var roundPattern = {
        "@y": "YYYY-01-01T00:00:00+00:00",
        "@mon": "YYYY-MM-01T00:00:00+00:00",
        "@d": "YYYY-MM-DDT00:00:00+00:00",
        "@h": "YYYY-MM-DDThh:00:00+00:00",
        "@m": "YYYY-MM-DDThh:mm:00+00:00",
        "@s": "YYYY-MM-DDThh:mm:ss+00:00",
        "@w0": "",
        "@w1": "",
        "none": "YYYY-MM-DDThh:mm:ss+00:00"
    }

    DatetimeModifier.prototype.convertToUTC = function (mod) {
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
        console.log('convert', plus_minus, num, unit, round)
        var utc = moment().utc()
        if (num && unit) {
            if (plus_minus === '-') {
                return utc.subtract(num, unit).format(roundPattern[round])
            } else {
                return utc.add(num, unit).format(roundPattern[round])
            }
        }

        if (!num && !unit && round) {
            return utc.format(roundPattern[round])
        }

        return null
    }

    return DatetimeModifier
})