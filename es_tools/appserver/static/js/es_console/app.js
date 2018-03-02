require.config({
    paths: {
        es: "../app/Clay/js/es_console"
    }
});

require([
    "jquery",
    "es/console",
    'splunkjs/mvc/simplexml/ready!'
], function (
    $,
    Console
) {

        var console = new Console({
            el: $('.dashboard-body')
        })

    })