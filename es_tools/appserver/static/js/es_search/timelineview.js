require.config({
    paths: {
        es: "../app/Clay/js/es_search",
        text: "../app/Clay/lib/text"
    }
})

define([
    "jquery",
    "underscore",
    "backbone",
    "es_config",
    "es/utils",
    "splunkjs/mvc/searchmanager",
    "splunkjs/mvc/chartview"
], function (
    $,
    _,
    Backbone,
    es_config,
    utils,
    SearchManager,
    ChartView) {

        var timeline = Backbone.View.extend({
            smgr: null,
            chart: null,
            "initialize": function () {
                this.on('search:start', this.search, this)
                this.smgr = new SearchManager({
                    id: "timeline-search"
                })
                this.chart = new ChartView({
                    id: "es-search-chart",
                    managerid: "timeline-search",
                    type: "column",
                    "height": 160,
                    "charting.legend.placement": "none",
                    "charting.seriesColors": "[0x65a637]",
                    "charting.axisTitleX.visibility": "collapsed",
                    "charting.axisTitleY.visibility": "collapsed",
                    "charting.axisTitleY2.visibility": "visible",
                    "charting.axisLabelsY2.axisVisibility": "show",
                    "charting.chart.columnSpacing": "0",
                    "charting.chart.seriesSpacing": "0",
                    "refresh.auto.interval": "5",
                    el: $(".timechart-content")
                })
            },
            "render": function () {

            },
            "search": function (qm, q) {
                var tq = {
                    "size": 0,
                    "aggs": {
                        "count_by_timestamp": {
                            "date_histogram": {
                                "field": "@timestamp",
                                "interval": utils.timelineInterval(q.get("query")['bool']['filter'])
                            }
                        }
                    },
                    "query": {},
                    "sort": [{
                        "@timestamp": {
                            "order": "desc"
                        }
                    }]
                }
                $.extend(true, tq.query, q.get("query"))
                var qdata = JSON.stringify(tq)
                qdata = qdata.replace(/"/g, '\\"')
                var url = es_config.es_host + '/' + qm.get("index") + '/_search'
                this.smgr.set({
                    search: ' | estimeline "' + url + '" "' + qdata + '" \
                    | eval _time = strptime(key_as_string,"%Y-%m-%dT%H:%M:%S")\
                    | rename doc_count as count \
                    | table _time, count'
                })
            }
        })

        return timeline
    })