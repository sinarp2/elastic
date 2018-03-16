require.config({
    paths: {
        js: "../app/Clay/js",
        es: "../app/Clay/js/es_search",
        text: "../app/Clay/lib/text"
    }
})

define([
    "jquery",
    "underscore",
    "backbone",
    "js/Chart.bundle.min",
    "es_config",
    "es/utils",
    "splunkjs/mvc/searchmanager",
    "splunkjs/mvc/chartview"
], function (
    $,
    _,
    Backbone,
    Chart,
    es_config,
    utils,
    SearchManager,
    ChartView) {

    var timeline = Backbone.View.extend({
        chart: null,
        events: {
            'search:start': function () {
                console.log('adsfasdfa')
            }
        },
        initialize: function () {
            this.on('search:start', this.search, this)
            var cfg = {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        type: 'bar',
                        pointRadius: 0,
                        fill: false,
                        lineTension: 0,
                        borderWidth: 0,
                        backgroundColor: 'rgb(101, 166, 55)'
                    }]
                },
                options: {
                    maintainAspectRatio: false,
                    title: {
                        display: false
                    },
                    legend: {
                        display: false
                    },
                    layout: {
                        padding: {
                            left: 10,
                            right: 10,
                            top: 0,
                            bottom: 0
                        }
                    },
                    scales: {
                        xAxes: [{
                            type: 'time',
                            distribution: 'series',
                            display: false,
                            categoryPercentage: 0.95,
                            barPercentage: 0.95
                        }],
                        yAxes: [{
                            position: 'left',
                            scaleLabel: {
                                display: false
                            },
                            ticks: {
                                display: false
                            },
                            gridLines: {
                                drawTicks: false
                            }
                        }, {
                            position: 'right',
                            scaleLabel: {
                                display: false
                            },
                            ticks: {
                                display: false
                            },
                            gridLines: {
                                display: false,
                                drawTicks: false
                            }
                        }]
                    },
                    scaleShowLabels: false,
                    onClick: function (evt, item) {
                        console.log('legend onClick', evt);
                        console.log('legd item', item);
                    }
                }
            };
            this.chart = new Chart('chart', cfg);
        },
        render: function (results) {
            var jsonResult = JSON.parse(results)
            var arr = jsonResult.aggregations.count_by_timestamp.buckets
            var series = []
            var labels = []
            _.each(arr, function (elm, idx) {
                series.push({
                    t: elm.key,
                    y: elm.doc_count
                })
                labels.push(elm.key_as_string)
            })
            this.chart.config.data.labels = labels
            this.chart.config.data.datasets[0].data = series
            this.chart.update()
        },
        search: function (qm, q) {
            var vm = this
            var ts = utils.get_timerange(q.get("query").bool.filter)
            var tq = {
                "size": 0,
                "aggs": {
                    "count_by_timestamp": {
                        "date_histogram": {
                            "field": "@timestamp",
                            "interval": utils.histo_interval(ts),
                            "min_doc_count": 0,
                            "extended_bounds": {
                                "min": ts.gte,
                                "max": ts.lte
                            }
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
            console.log('timequery', ts.gte, ts.lte, utils.histo_interval(ts))
            var onSuccess = function (res) {
                vm.render(res)
            }
            var onError = function (e) {
                vm.errorHandler(e)
            }
            $.ajax(es_config.esapi, {
                data: {
                    method: 'GET',
                    uri: qm.get("uri"),
                    data: JSON.stringify(tq)
                },
                success: onSuccess,
                error: onError,
                dataType: "json"
            })
        },
        errorHandler: function (e) {
            console.log(e)
        }
    })

    return timeline
})