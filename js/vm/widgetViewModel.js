

function WidgetViewModel(parent, id, chartType, data) {

    var self = this;

    self.parent = parent;
    self.root = self.parent.root;

    self.data = data;

    self.id = id;

    self.fields = getFields();

    self.key = getKey();

    self.chartType = chartType;
    self.charts = [];

    self.widget = $('#'+ self.id);
    self.container = self.widget.find('.chart');
    self.controls = self.widget.find('.controls');

    self.total;
    self.sold;
    self.isPrem;

    self.fieldSelect = d3.select('#' + self.id + ' .field-select');
    self.fieldBtn = d3.select('#' + self.id + ' .dropdown-toggle .text');

    self.chartBtns = self.widget.find('.chart-select button');
    self.totalBtns = self.widget.find('.total-select button');
    var gridBtn = self.chartBtns.filter('[data-viz="grid"]');
    var nonGridBtn = self.chartBtns.filter(':not([data-viz="grid"])');



    /* Public Methods ------------------------------------------------------------------------------------------------
     ---------------------------------------------------------------------------------------------------------------- */

    //resize widgets, call initial functions
    self.init = function() {
        self.sizeWidgets();
        selectTotal();
        initTotalBtns();
        initChartBtns();
        initDropdown();
        self.setChartType(self.chartType, true);
    };

    //sets the key value for the viewModel
    self.setKey = function(key, originalEvent) {

        self.key = key;

        var a = self.fieldSelect.selectAll("li")
                                .classed("active", false)
                                .selectAll("a");
        a.filter(function (d) {
            if(d === self.key) {
                d3.select(this.parentNode).classed("active", true);
            }
        });

        self.setChart();

        self.fieldBtn.text(self.key);

    };

    //sets the selected chart visual (line, bar, etc)
    self.setChartType = function(chart, originalEvent) {
        var btn = self.chartBtns.filter('[data-viz="' + chart + '"]');

        self.chartType = chart;

        if(originalEvent) $.cookie(self.id, chart, { expires: 7 });

        if(!btn.hasClass("active")) {
            self.selectBtn(btn, self.chartBtns);
            self.setChart();
        }
    };

    //nests data according to key, make sure data columns are within a reasonable limit for displaying a chart,
    //show the right chart
    self.setChart = function() {
        var data = self.parent.nestData(self.key, self.data);
        limitChart(data.length);
        selectChart(data);
        self.parent.loaded();
    };

    //remove chart HTML from the DOM,
    //remove reference to chart from viewModel
    self.clearChart = function() {
        self.container.empty();
        self.charts = [];
    };

    //sets the height of each widget + chart container.
    self.sizeWidgets = function() {

        var windowW = $(window).width(),
            windowH = $(window).height(),
            widgetH = (windowW<1024) ? 350 : windowH / 2 - 32,
            controlH = self.controls.outerHeight(),
            chartH = widgetH - controlH;

        self.widget.height(widgetH);
        self.container.height(chartH);

    };

    //returns proper width and height for a given chart
    self.sizeContainers = function (target) {

        var windowW = $(window).width(),
            windowH = $(window).height(),
            widgetH = (windowW<1024) ? 350 : windowH / 2 - 32,
            controlH = 48,
            margin = self.margin,
            width = $(target).width() - margin.left - margin.right,
            height = widgetH - controlH - margin.top - margin.bottom;

        return { width: Math.abs(width), height: Math.abs(height) };

    };

    //chart margin settings
    self.margin = {
        top: 20,
        right: 20,
        bottom: 30,
        left: 70
    };

    //array of colors for pie charts
    self.color = function () {
        var color = [];
        for (i = 0; i < 3; i++) {
            color = color.concat(colorbrewer.Paired[12]);
        }
        return color;
    };

    //array of 2 colors for line and bar charts
    self.colorPrem = function (isPrem) {
        var self = this,
            color = self.color();
        return (isPrem) ? [color[2], color[3]] : [color[0], color[1]];
    };

    //formats dates into m/d/YYYY for display
    self.formatDate = function(date) {

        var self = this,
            len = date.length;

        switch (len) {
            case 7:
                var date = getDateParts(d3.time.format("%Y-%m"), date);
                return date.month+"/"+date.year;
                break;
            case 10:
                var date = getDateParts(d3.time.format("%Y-%m-%d"), date);
                return date.month+"/"+date.day+"/"+date.year;
                break;
            default:
                return date;
        }

    };

    //skips selected dropdown item when timeline or variable field is selected
    self.skipField = function() {

        var active = self.widget.find(".field-select li.active"),
            next = active.next().children('a');

        next.d3Click();

    };

    //give button active css class on click,
    //remove active class from other buttons in the group
    self.selectBtn = function(btn, group) {
        group.removeClass("active");
        btn.addClass("active");
    };

    /* Private Methods ------------------------------------------------------------------------------------------------
     ---------------------------------------------------------------------------------------------------------------- */

    //get the right fields pertaining to this widget
    function getFields() {

        var fields = self.parent.mappings;

        fields = fields.filter(function (d) {
            return (d[self.id]);
        });

        fields.sort(function(a, b) {
            if (a.value < b.value) return -1;
            if (a.value > b.value) return 1;
            return 0;
        });

        return fields;

    }

    //get the initially selected field
    function getKey() {

        var key = self.fields;

        key = key.filter(function (d) {
            return (d.selected);
        });

        return key[0].value;

    }

    //populate the widget's dropdown with the fields
    function initDropdown() {
        var fields = [];

        self.fields.forEach(function(v, i) {
           fields.push(v.value);
        });

        self.fieldBtn.text(self.key);

        var items = self.fieldSelect.selectAll("li")
            .data(fields).enter()
            .append("li");

        items.classed("active", function (d) {
                return d === self.key;
            })
            .append("a")
            .attr("href", "#")
            .attr("data-key", function (d) {
                return d;
            })
            .text(function (d) {
                return d;
            })
            .on('click', function (d) {
                d3.event.preventDefault();
                self.setKey(d);
            });

    }

    //chart type select buttons, set chart = button initially selected
    function initChartBtns() {
        self.chartBtns.on("click", function() {
            self.setChartType($(this).data("viz"), true);
        });
    }

    //chart type select buttons, set chart = button initially selected
    function initTotalBtns() {
        self.totalBtns.on("click", function() {
            self.selectBtn($(this), self.totalBtns);
            selectTotal();
            self.setChart();
        });

    }

    //need to come up with a better solution for this.
    function selectTotal() {
        var active = self.totalBtns.filter(".active"),
            isPrem = (active.data("type") === "money"),
            total = active.data("total"),
            sold = active.data("sold");

        self.isPrem = isPrem;
        self.total = total;
        self.sold = sold;
    }

    //force selection of the grid button
    function selectGrid() {
        self.setChartType("grid", false);
        self.selectBtn(gridBtn, self.chartBtns);
    }

    //if the data has too many keys for chart display
    //show the grid instead
    function limitChart(len) {

        var limit = (self.id === "timeline") ? 120 : 30;
        var cookie = $.cookie(self.id);

        self.chartBtns.attr('disabled', null);
        self.totalBtns.attr('disabled', null);

        if (len > limit || len < 2) {

            nonGridBtn.attr("disabled", true);
            if (self.chartType != "grid") {
                selectGrid();
            }
        }
        else {
            //if grid was force selected due to limit
            //and then filter is removed or field changed
            //and len is now within the limit
            //revert to the last saved chart type from the cookie
            if(cookie && cookie != self.chartType) {
                var btn = self.chartBtns.filter('[data-viz="' + cookie + '"]');
                self.selectBtn(btn, self.chartBtns);
                self.chartType = cookie;
            }
        }

        if (self.chartType === "grid") {
            self.totalBtns.attr('disabled', true);
        }

    }

    //decides which chart(s) to show and loads it into this viewModel.
    function selectChart(data) {

        self.clearChart();
        sortData(data);

        var chart;

        switch (self.chartType) {
            case "pie":
                chart = new pieChart(self, data);
                break;
            case "line":
                chart = new lineChart(self, data);
                break;
            case "grid":
                chart = new grid(self, data);
                break;
            default:
                chart = new barChart(self, data);
        }

        self.charts.push(chart);
        chart.init();

        if(data.length == 1) {
            var chart;
            chart = new singleChart(self, data);
            self.charts.push(chart);
            chart.init();
        }

    }

    //sort data descending
    function sortData(data) {

        if(self.id != "timeline") {
            data = data.sort(function(a, b) {
                return b.values[self.total] - a.values[self.total];
            });
        }
        else {
            data = filterSaleMade(data);
        }
    }

    //filter out unsold quotes for timeline if a "Sale Written" field is selected
    function filterSaleMade(data) {
        var rangeField = self.key;

        if (rangeField.substr(0, 12) === "Sale Written") {
            data = data.filter(function (d) {
                return (d.key != "");
            });
        }

        return data;
    }

    //Break a date into parts and return them
    function getDateParts(format, date) {
        var date = format.parse(date),
            year = date.getFullYear().toString().substr(2, 2),
            month = date.getMonth() + 1,
            day = date.getDate();

        return { year: year, month: month, day: day };
    }


}
