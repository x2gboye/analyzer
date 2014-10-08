
function lineChart(parent, data) {

    var self = this;

    self.parent = parent;
    self.root = self.parent.root;
    self.key = self.parent.key;
    self.id = self.parent.id;

    self.widget = self.parent.widget;
    self.total = self.parent.total;
    self.sold = self.parent.sold;
    self.isPrem = self.parent.isPrem;
    self.color =  self.parent.colorPrem(self.isPrem);

    var margin = self.parent.margin;
    var container = self.parent.sizeContainers(self.widget);


    /* Public Methods ------------------------------------------------------------------------------------------------
     ---------------------------------------------------------------------------------------------------------------- */

    self.init = function () {

        initSettings();
        drawSVG();

        drawLine(self.series1, self.line, self.total, self.color[0]);
        drawLine(self.series2, self.line2, self.sold, self.color[1]);

        drawLegend(self.legend, 20, 0, self.color[0], self.total);
        drawLegend(self.legend, 20, 20, self.color[1], self.sold);

        initEvents();

    };


    /* Private Methods ------------------------------------------------------------------------------------------------
     ---------------------------------------------------------------------------------------------------------------- */

    //settings for the line chart layout (x/y axis, svg line definition)
    function initSettings() {

        var x = d3.scale.ordinal().rangeRoundBands([0, container.width], .1),
            y = d3.scale.linear().range([container.height, 0]);

        x.domain(data.map(function (d) {
            return d.key;
        }));
        y.domain([0, d3.max(data, function (d) {
            return d.values[self.total];
        })]);

        var xAxis = d3.svg.axis()
            .tickFormat(function (d) {
                return (self.id === "timeline") ? self.parent.formatDate(d) : d;
            })
            .scale(x)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .tickFormat(function (d) {
                if (self.isPrem) {
                    var M = d / 1000000,
                        K = d / 1000;
                    if (M >= 1) {
                        return "$" + M + "M";
                    }
                    else if (K >= 1) {
                        return "$" + K + "K";
                    }
                    else {
                        return "$" + d;
                    }
                }
                else {
                    return d;
                }
            })
            .scale(y)
            .orient("left");

        var lineStart = d3.svg.line()
            .interpolate("linear")
            .x(function (d) {
                return x(d.key) + x.rangeBand() / 2;
            })
            .y(function (d) {
                return 0
            });

        var line = d3.svg.line()
            .interpolate("linear")
            .x(function (d) {
                return x(d.key) + x.rangeBand() / 2;
            })
            .y(function (d) {
                return y(d.values[self.total]);
            });

        var line2 = d3.svg.line()
            .interpolate("linear")
            .x(function (d) {
                return x(d.key) + x.rangeBand() / 2;
            })
            .y(function (d) {
                return y(d.values[self.sold]);
            });

        self.x = x;
        self.y = y;
        self.xAxis = xAxis;
        self.yAxis = yAxis;
        self.lineStart = lineStart;
        self.line = line;
        self.line2 = line2;

    }

    //create the svg elements for the line chart
    function drawSVG(){

        //create svg element and size it
        var svg = d3.select("#" + self.id + " .chart")
            .append("svg")
            .attr("width", container.width + margin.left + margin.right)
            .attr("height", container.height + margin.top + margin.bottom)
            .attr("viewBox", "0, 0, "
                + (container.width + margin.left + margin.right)
                + ", "
                + (container.height + margin.top + margin.bottom));
        //.attr("preserveAspectRatio", "xMinYMid")

        //create group for all line chart elements
        var chart = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        //horizontal lines in the background bound to the y axis
        var hGrid = chart.selectAll("line.horizontalGrid")
            .data(self.y.ticks).enter()
            .append("line")
            .attr("class", "horizontalGrid")
            .attr("x1", 0)
            .attr("x2", container.width)
            .attr("y1", function (d) {
                return self.y(d);
            })
            .attr("y2", function (d) {
                return self.y(d);
            });


        //create the x axis
        var axisX = chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + container.height + ")")
            .call(self.xAxis);

        //Lengthen odd Y axis label ticks for staggering labels
        axisX.selectAll("g.tick line")
            .attr("y2", function (d, i) {
                return (i % 2) ? 14 : 4;
            })
            .attr("opacity", function (d, i) {
                var o;
                if (data.length > 30) {
                    o = (i % 4) ? 0 : 1;
                }
                else {
                    o = 1;
                }
                return o;
            });

        //Stagger odd Y axis labels so labels don't overlap
        axisX.selectAll("g.tick text")
            .attr("y", function (d, i) {
                return (i % 2) ? 15 : 5;
            })
            .attr("opacity", function (d, i) {
                var o;
                if (data.length > 30) {
                    o = (i % 4) ? 0 : 1;
                }
                else {
                    o = 1;
                }
                return o;
            });



        //create the y axis
        var axisY = chart.append("g")
            .attr("class", "y axis")
            .call(self.yAxis);

        //create series for 1st line & points
        var series1 = chart.append("g")
            .attr("class", "series1");


        //create series for 2nd line & points
        var series2 = chart.append("g")
            .attr("class", "series2");

        //create events group, will hold elements for binding mouse events to
        var events = chart.append("g")
            .attr("class", "events");

        //create a group for the chart legend
        var legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", "translate(" + margin.left + ", 0)");

        //create a group for the chart key
        legend = legend.append("g")
            .attr("class", "key")
            .attr("transform", "translate(" + (container.width - 150) + ", 6)");

        legend.append("rect")
            .attr("height", 37)
            .attr("width", 150)
            .attr("x", 0)
            .attr("fill", "white")
            .attr("fill-opacity", 0.75);

        var title = chart.append("text")
            .attr("x", container.width / 2)
            .attr("y", -5)
            .attr("class", "title")
            .text(self.key);


        self.series1 = series1;
        self.series2 = series2;
        self.events = events;
        self.legend = legend;


    }

    function drawLine(series, line, values, color) {

        series.append("path")
            .datum(data)
            .style("fill", "none")
            .style("stroke", color)
            .style("stroke-width", "4px")
            .attr("class", "line")
            .attr("d", self.lineStart)
            .transition()
            .duration(500)
            .attr("d", line);

        series.selectAll(".point")
            .data(data)
            .enter().append("circle")
            .attr("class", "point")
            .attr("cx", function (d) {
                return self.x(d.key) + self.x.rangeBand() / 2;
            })
            .attr("cy", 0)
            .attr("r", "5px")
            .attr("fill", color)
            .attr("fill-opacity", 0)
            .transition()
            .duration(500)
            .attr("cy", function (d) {
                return self.y(d.values[values]);
            });

    }

    function drawLegend(legend, offsetX, offsetY, color, values) {

        legend.append("rect")
            .attr("height", 12)
            .attr("width", 12)
            .attr("x", 5)
            .attr("y", offsetY)
            .attr("fill", color);

        legend.append("text")
            .attr("dy", "1em")
            .attr("x", offsetX)
            .attr("y", offsetY)
            .text(values);

    }

    function initEvents() {

        self.events.selectAll(".hover")
            .data(data)
            .enter().append("rect")
            .attr("class", "hover")
            .attr("x", function (d) {
                return self.x(d.key);
            })
            .attr("y", function (d) {
                return self.y(d.values[self.total]);
            })
            .attr("height", function (d) {
                return container.height - self.y(d.values[self.total]);
            })
            .attr("width", self.x.rangeBand())
            .attr("fill", "white")
            .attr("fill-opacity", 0)
            .on("click", function (d) {
                var filter = { key: self.key, value: d.key };
                self.root.addFilter(filter, true);
                if (self.id === "variable" || self.id === "timeline") {
                   self.parent.skipField();
                }
                self.root.hideTip();
            })
            .on("mousemove", function (d, i) {
                selectArea(d, i);
            })
            .on("mouseleave", function () {
                deselectArea();
            });

    }

    function selectArea (d, i) {
        $('#' + self.id + ' .line').attr("stroke-opacity", 0.5);
        $('#' + self.id + ' .series1 .point:eq(' + i + ')').attr("fill-opacity", 1.0);
        $('#' + self.id + ' .series2 .point:eq(' + i + ')').attr("fill-opacity", 1.0);
        var key = (self.id === "timeline") ? self.parent.formatDate(d.key) : d.key;
        self.root.showTip(self.root.mouse.x, self.root.mouse.y, key, d.values);
    }

    function deselectArea () {
        $('#' + self.id + ' .line').attr("stroke-opacity", 1.0);
        $('#' + self.id + ' .point').attr("fill-opacity", 0);
        self.root.hideTip();
    }

}
