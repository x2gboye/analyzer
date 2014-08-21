var ANLZ = ANLZ || {};

ANLZ.util = {

    sizeContainers: function (target) {

        var widgetH = $(window).height() / 2 - 32,
            controlH = 45,
            margin = ANLZ.settings.margin,
            width = $(target).width() - margin.left - margin.right,
            height = widgetH - controlH - margin.top - margin.bottom;

        $(target).height(widgetH);

        return { width: Math.abs(width), height: Math.abs(height) };

    },

    onResize: function (widgets) {

        var self = this;

        $.each(widgets, function (index, value) {
            ANLZ.chart.clear(value);
            var widget = $("#" + value),
                chart = widget.find(".chart"),
                margin = ANLZ.settings.margin,
                containerW = self.sizeContainers("#" + value).width + margin.left + margin.right,
                containerH = self.sizeContainers("#" + value).height + margin.top + margin.bottom;
            if (value === "all") {
                widget.css("height", ($(window).height() - 32) + "px");
                widget.find("iframe").css("height", ($(window).height() - 32) + "px");
            }
            else if (value === "filters" || value === "saved") {
                var tabsH = $('#searchTabs').height();
                widget.css("height", (containerH + 21) + "px");
            }
            else {
                chart.css("height", (containerH + 5) + "px");
            }

        });

        ANLZ.init.clickActiveBtns();

    },

    loaded: function () {
        $('.loading').hide();
    },

    mouse: {x: 0, y: 0}

};