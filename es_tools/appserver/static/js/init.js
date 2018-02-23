require.config({
    paths: {
    	text	: "../app/Clay/lib/text",
        pwdEdit	: "../app/Clay/templates/js/clay-pwdedit",
        pop		: "../app/Clay/templates/js/clay-pop",
        config	: "../app/Clay/js/config",
        util	: "../app/Clay/js/util",
        jqGrid	: "../app/Clay/lib/jqGrid/js/jquery.jqGrid.min",
        jqUi 	: "../app/Clay/lib/jqUi/jquery-ui.min" 	
    },
    shim:{
    	"jqGrid":{
            deps: [
               "jquery",
               "../app/Clay/lib/jqGrid/js/i18n/grid.locale-en",
               "../app/Clay/lib/jqGrid/js/grid.base",
               "../app/Clay/lib/jqGrid/js/grid.common",
               "../app/Clay/lib/jqGrid/js/jqDnR",
               "../app/Clay/lib/jqGrid/js/jqModal",
               "css!../app/Clay/lib/jqGrid/css/ui.jqgrid-bootstrap.css"
            ], 
            exports:"jqGrid" //로드된 angular 라이브러리는 angular 라는 이름의 객체로 사용할 수 있게 해준다
        },
        "jqUi":{
            deps: [
               "jquery",
               "css!../app/Clay/lib/jqUi/jquery-ui.css"
            ], 
            exports:"jqUi" //로드된 angular 라이브러리는 angular 라는 이름의 객체로 사용할 수 있게 해준다
        }
    	
    }
});
require([
    "splunkjs/mvc",
    "splunkjs/mvc/utils",
    "splunkjs/mvc/tokenutils",
    "underscore",
    "jquery",
    "splunkjs/mvc/simplexml",
    "splunkjs/mvc/layoutview",
    "splunkjs/mvc/simplexml/dashboardview",
    "splunkjs/mvc/simplexml/dashboard/panelref",
    "splunkjs/mvc/simplexml/element/chart",
    "splunkjs/mvc/simplexml/element/event",
    "splunkjs/mvc/simplexml/element/html",
    "splunkjs/mvc/simplexml/element/list",
    "splunkjs/mvc/simplexml/element/map",
    "splunkjs/mvc/simplexml/element/single",
    "splunkjs/mvc/simplexml/element/table",
    "splunkjs/mvc/simplexml/element/visualization",
    "splunkjs/mvc/simpleform/formutils",
    "splunkjs/mvc/simplexml/eventhandler",
    "splunkjs/mvc/simplexml/searcheventhandler",
    "splunkjs/mvc/simpleform/input/dropdown",
    "splunkjs/mvc/simpleform/input/radiogroup",
    "splunkjs/mvc/simpleform/input/linklist",
    "splunkjs/mvc/simpleform/input/multiselect",
    "splunkjs/mvc/simpleform/input/checkboxgroup",
    "splunkjs/mvc/simpleform/input/text",
    "splunkjs/mvc/simpleform/input/timerange",
    "splunkjs/mvc/simpleform/input/submit",
    "splunkjs/mvc/searchmanager",
    "splunkjs/mvc/savedsearchmanager",
    "splunkjs/mvc/postprocessmanager",
    "splunkjs/mvc/simplexml/urltokenmodel",
    "css!../app/Clay/clay-common.css"
    ],
    function(
        mvc,
        utils,
        TokenUtils,
        _,
        $,
        DashboardController,
        LayoutView,
        Dashboard,
        PanelRef,
        ChartElement,
        EventElement,
        HtmlElement,
        ListElement,
        MapElement,
        SingleElement,
        TableElement,
        VisualizationElement,
        FormUtils,
        EventHandler,
        SearchEventHandler,
        DropdownInput,
        RadioGroupInput,
        LinkListInput,
        MultiSelectInput,
        CheckboxGroupInput,
        TextInput,
        TimeRangeInput,
        SubmitButton,
        SearchManager,
        SavedSearchManager,
        PostProcessManager,
        UrlTokenModel

        ) {
		(function($) {
			var appendNoCallback = $.fn.append;
			$.fn.append = function() {
				var backup = appendNoCallback.apply(this, arguments);
				if(typeof arguments[1] == "function") arguments[1]();
				return backup;
			};

		})($);
	
		
		$("header").remove();
	    new LayoutView({"hideFooter": true, "hideAppBar": false, "hideSplunkBar": true, "hideChrome": false})
	        .render()
	        .getContainerElement()
	        .appendChild($(".dashboard-body")[0]);
        
	    Date.prototype.format = function(f) {
	        if (!this.valueOf()) return " ";
	     
	        var weekName = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
	        var d = this;
	         
	        return f.replace(/(yyyy|yy|MM|dd|E|hh|mm|ss|a\/p)/gi, function($1) {
	            switch ($1) {
	                case "yyyy": return d.getFullYear();
	                case "yy": return (d.getFullYear() % 1000).zf(2);
	                case "MM": return (d.getMonth() + 1).zf(2);
	                case "dd": return d.getDate().zf(2);
	                case "E": return weekName[d.getDay()];
	                case "HH": return d.getHours().zf(2);
	                case "hh": return ((h = d.getHours() % 12) ? h : 12).zf(2);
	                case "mm": return d.getMinutes().zf(2);
	                case "ss": return d.getSeconds().zf(2);
	                case "a/p": return d.getHours() < 12 ? "오전" : "오후";
	                default: return $1;
	            }
	        });
	    };
	     
	    String.prototype.string = function(len){var s = '', i = 0; while (i++ < len) { s += this; } return s;};
	    String.prototype.zf = function(len){return "0".string(len - this.length) + this;};
	    Number.prototype.zf = function(len){return this.toString().zf(len);};

    }
);