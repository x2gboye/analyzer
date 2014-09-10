var ANLZ = ANLZ || {};

ANLZ.util = {

    sizeContainers: function (target) {

        var windowW = $(window).width(),
            windowH = $(window).height(),
            widgetH = (windowW<1024) ? 350 : windowH / 2 - 32,
            controlH = 45,
            margin = ANLZ.settings.margin,
            width = $(target).width() - margin.left - margin.right,
            height = widgetH - controlH - margin.top - margin.bottom;

        $(target).height(widgetH);

        return { width: Math.abs(width), height: Math.abs(height) };

    },

    onResize: function (widgets) {

        var self = this,
            tab = $('.container-fluid > .tab-pane.active').attr("id");

        $.each(widgets, function (index, value) {
            ANLZ.chart.clear(value);
            var windowH = $(window).height(),
                windowW = $(window).width(),
                widget = $("#" + value),
                chart = widget.find(".chart"),
                margin = ANLZ.settings.margin,
                containerW = self.sizeContainers("#" + value).width + margin.left + margin.right,
                containerH = self.sizeContainers("#" + value).height + margin.top + margin.bottom;
            if (value === "all" || value === "usmap") {
                widget.css("height", function() {
                    var height = (windowW<1024) ? (windowH - 84) : (windowH - 32);
                    return height + "px";
                });
                widget.find("iframe").css("height", function() {
                    var height = (windowW<1024) ? (windowH - 84) : (windowH - 32);
                    return height + "px";
                });
            }
            else if (value === "filters" || value === "saved") {
                var tabsH = $('#searchTabs').height();
                widget.css("height", (containerH + 21) + "px");
            }
            else {
                chart.css("height", (containerH + 5) + "px");
            }

        });

        if(tab === "map")  {
            ANLZ.util.loading();
            ANLZ.map.draw();
        }
        else {
            ANLZ.init.clickActiveBtns();
        }


    },

    loading: function (html) {
        var div = $('.loading > div');
        if(html) {
            div.html(html);
        }
        else {
            div.html("Loading...");
        }
        $('.loading').show();
    },

    loaded: function () {
        $('.loading').hide();
    },

    mouse: {x: 0, y: 0},

    getDateParts: function(format, date) {
        var date = format.parse(date),
            year = date.getFullYear().toString().substr(2, 2),
            month = date.getMonth() + 1,
            day = date.getDate();
        return { year: year, month: month, day: day };
    },

    formatDate: function(date) {
        var self = this,
            len = date.length;
        switch (len) {
            case 7:
                var date = self.getDateParts(d3.time.format("%Y-%m"), date);
                return date.month+"/"+date.year;
                break;
            case 10:
                var date = self.getDateParts(d3.time.format("%Y-%m-%d"), date);
                return date.month+"/"+date.day+"/"+date.year;
                break;
            default:
                return date;
        }
    }

};