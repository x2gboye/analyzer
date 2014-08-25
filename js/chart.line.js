var ANLZ = ANLZ || {};
ANLZ.chart = ANLZ.chart || {};

//LINE CHART
ANLZ.chart.line = function (field, data, target) {

    var total = $(target).find('.total-select button.active').data("total"),
        sold = $(target).find('.total-select button.active').data("sold"),
        isPrem = (total.indexOf("Premium") == -1) ? false : true,
        settings = ANLZ.settings,
        util = ANLZ.util,
        filter = ANLZ.filter,
        tip = ANLZ.tip,
        color = settings.colorPrem(isPrem),
        container = util.sizeContainers(target),
        margin = settings.margin;

    if(target != "#timeline") {
        data = data.sort(function(a, b) {
            return b.values[total] - a.values[total];
        });
    }
    else {
        data = filter.saleMade(data);
    }

    if(data.length>0) {

        var x = d3.scale.ordinal()
            .rangeRoundBands([0, container.width], .1);

        var y = d3.scale.linear()
            .range([container.height, 0]);

        var xAxis = d3.svg.axis()
            .tickFormat(function (d) {
                return (target === "#timeline") ? util.formatDate(d) : d;
            })
            .scale(x)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .tickFormat(function (d) {
                if (isPrem) {
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
                return y(d.values[total]);
            });

        var line2 = d3.svg.line()
            .interpolate("linear")
            .x(function (d) {
                return x(d.key) + x.rangeBand() / 2;
            })
            .y(function (d) {
                return y(d.values[sold]);
            });

        var chart = d3.select(target + " .chart")
            .append("svg")
            .attr("width", container.width + margin.left + margin.right)
            .attr("height", container.height + margin.top + margin.bottom)
            .attr("viewBox", "0, 0, " + (container.width + margin.left + margin.right) + ", " + (container.height + margin.top +
                margin.bottom))
            //.attr("preserveAspectRatio", "xMinYMid")
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        x.domain(data.map(function (d) {
            return d.key;
        }));
        y.domain([0, d3.max(data, function (d) {
            return d.values[total];
        })]);

        chart.selectAll("line.horizontalGrid").data(y.ticks).enter()
            .append("line")
            .attr("class", "horizontalGrid")
            .attr("x1", 0)
            .attr("x2", container.width)
            .attr("y1", function (d) {
                return y(d);
            })
            .attr("y2", function (d) {
                return y(d);
            });

        chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + container.height + ")")
            .call(xAxis);


        //Lengthen odd Y axis label ticks for staggering labels
        chart.selectAll("g.x.axis g.tick line")
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
        chart.selectAll("g.x.axis g.tick text")
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

        chart.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        var series = chart.append("g")
            .attr("class", "series");

        //line
        series.append("path")
            .datum(data)
            .style("fill", "none")
            .style("stroke", color[0])
            .style("stroke-width", "4px")
            .attr("class", "line")
            .attr("d", lineStart)
            .transition()
            .duration(500)
            .attr("d", line);

        //line points
        series.selectAll(".point")
            .data(data)
            .enter().append("circle")
            .attr("class", "point")
            .attr("cx", function (d) {
                return x(d.key) + x.rangeBand() / 2;
            })
            .attr("cy", 0)
            .attr("r", "5px")
            .attr("fill", color[0])
            .attr("fill-opacity", 0)
            .transition()
            .duration(500)
            .attr("cy", function (d) {
                return y(d.values[total]);
            });


        var series2 = chart.append("g")
            .attr("class", "series2");

        //line
        series2.append("path")
            .datum(data)
            .style("fill", "none")
            .style("stroke", color[1])
            .style("stroke-width", "4px")
            .attr("class", "line")
            .attr("d", lineStart)
            .transition()
            .duration(500)
            .attr("d", line2);

        //line points
        series2.selectAll(".point")
            .data(data)
            .enter().append("circle")
            .attr("class", "point")
            .attr("cx", function (d) {
                return x(d.key) + x.rangeBand() / 2;
            })
            .attr("cy", 0)
            .attr("r", "5px")
            .attr("fill", color[1])
            .attr("fill-opacity", 0)
            .transition()
            .duration(500)
            .attr("cy", function (d) {
                return y(d.values[sold]);
            });

        var events = chart.append("g")
            .attr("class", "events");

        events.selectAll(".hover")
            .data(data)
            .enter().append("rect")
            .attr("class", "hover")
            .attr("x", function (d) {
                return x(d.key);
            })
            .attr("y", function (d) {
                return y(d.values[total]);
            })
            .attr("height", function (d) {
                return container.height - y(d.values[total]);
            })
            .attr("width", x.rangeBand())
            .attr("fill", "white")
            .attr("fill-opacity", 0)
            .on("click", function (d) {
                filter.add(field, d.key);
                if (target === "#prospects" || target === "#timeline") {
                    filter.skipField(field);
                }
                tip.hide();
            })
            .on("mousemove", function (d, i) {
                selectArea(d, i);
            })
            .on("mouseleave", function () {
                deselectArea();
            });


        //legend
        var legend = d3.select(target + " .chart svg")
            .append("g")
            .attr("class", "legend")
            .attr("transform", function (d, i) {
                return "translate(" + margin.left + ", 0)";
            });

        var offset = 20;

        //key
        var key = legend.append("g")
            .attr("class", "key")
            .attr("transform", function (d, i) {
                return "translate(" + (container.width - 150) + ", 6)";
            });

        key.append("rect")
            .attr("height", 37)
            .attr("width", 150)
            .attr("x", 0)
            .attr("fill", "white")
            .attr("fill-opacity", 0.75);

        key.append("rect")
            .attr("height", 12)
            .attr("width", 12)
            .attr("x", 5)
            .attr("fill", color[0]);

        key.append("text")
            .attr("dy", "1em")
            .attr("x", offset)
            .text(total);

        key.append("rect")
            .attr("height", 12)
            .attr("width", 12)
            .attr("x", 5)
            .attr("y", offset)
            .attr("fill", color[1]);

        key.append("text")
            .attr("dy", "1em")
            .attr("x", offset)
            .attr("y", offset)
            .text(sold);


        chart.append("text")
            .attr("x", container.width / 2)
            .attr("y", -5)
            .attr("class", "title")
            .text(field);

        function selectArea(d, i) {
            $(target + ' .line').attr("stroke-opacity", 0.5);
            $(target + ' .series .point:eq(' + i + ')').attr("fill-opacity", 1.0);
            $(target + ' .series2 .point:eq(' + i + ')').attr("fill-opacity", 1.0);
            var key = (target === "#timeline") ? util.formatDate(d.key) : d.key;
            tip.show(util.mouse.x, util.mouse.y, key, d.values);
        }

        function deselectArea() {
            $(target + ' .line').attr("stroke-opacity", 1.0);
            $(target + ' .point').attr("fill-opacity", 0);
            tip.hide();
        }

    }

};
