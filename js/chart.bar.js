var ANLZ = ANLZ || {};
ANLZ.chart = ANLZ.chart || {};

//BAR CHART

ANLZ.chart.bar = function (field, data, target) {

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

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, container.width], .1);

    var y = d3.scale.linear()
        .range([container.height, 0]);

    var xAxis = d3.svg.axis()
        .tickFormat(function(d) {
            if(target === "#timeline") {
                switch (field) {
                    case "Quote Year and Month Created":
                        var date = ANLZ.util.formatDate(d3.time.format("%Y-%m"), d);
                        date = date.month+"/"+date.year;
                        break;
                    case "Quote Date Created":
                        var date = ANLZ.util.formatDate(d3.time.format("%Y-%m-%d"), d);
                        date = date.month+"/"+date.day+"/"+date.year;
                        break;
                    default:
                        date = d;
                }
                return date;
            }
            else {
                return d;
            }
        })
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .tickFormat(function(d) {
            if(isPrem) {
                var M = d / 1000000,
                    K = d / 1000;
                if(M>=1) {
                    return "$"+M+"M";
                }
                else if(K>=1) {
                    return "$"+K+"K";
                }
                else {
                    return "$"+d;
                }
            }
            else {
                return d;
            }
        })
        .scale(y)
        .orient("left");

    x.domain(data.map(function (d) {
        return d.key;
    }));

    y.domain([0, d3.max(data, function (d) {
        return d.values[total];
    })]);


    var chart = d3.select(target + " .chart")
        .append("svg")
        .attr("width", container.width + margin.left + margin.right)
        .attr("height", container.height + margin.top + margin.bottom)
        .attr("viewBox", "0, 0, " + (container.width + margin.left + margin.right) + ", " + (container.height + margin.top + margin.bottom))
        //.attr("preserveAspectRatio", "xMinYMid")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    chart.selectAll("line.horizontalGrid")
        .data(y.ticks).enter()
        .append("line")
        .attr("class", "horizontalGrid")
        .attr("x1", 0)
        .attr("x2", container.width)
        .attr("y1", function(d){ return y(d);})
        .attr("y2", function(d){ return y(d);});

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
            if(data.length>30) {
                o = (i % 4) ? 0 : 1;
            }
            else{
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
            if(data.length>30) {
                o = (i % 4) ? 0 : 1;
            }
            else{
                o = 1;
            }
            return o;
        });

    chart.append("g")
        .attr("class", "y axis")
        .call(yAxis);


    var barGroup = chart.selectAll(".bar-group")
        .data(data)
        .enter().append("g")
        .attr("class", "bar-group")
        .attr("x", function (d) {
            return x(d.key);
        })
        .attr("height", function (d) {
            return container.height;
        })
        .attr("y", 0)
        .on("click", function(d, i) {
            filter.add(field, d.key);
            if(target === "#prospects" || target === "#timeline") {
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

    //bars
    barGroup.append("rect")
        .attr("class", "bar")
        .attr("fill", color[0])
        .attr("x", function (d) {
            return x(d.key);
        })
        .attr("y", function (d) {
            return y(0);
        })
        .attr("width", x.rangeBand())
        .attr("height", 0)
        .transition()
        .duration(500)
        .attr("height", function (d) {
            return container.height - y(d.values[total]);
        })
        .attr("y", function (d) {
            return y(d.values[total]);
        });



    barGroup.append("rect")
        .attr("class", "bar2")
        .attr("fill", color[1])
        .attr("x", function (d) {
            return x(d.key);
        })
        .attr("y", function (d) {
            return y(0);
        })
        .attr("width", x.rangeBand())
        .attr("height", 0)
        .transition()
        .duration(500)
        .attr("height", function (d) {
            return container.height - y(d.values[sold]);
        })
        .attr("y", function (d) {
            return y(d.values[sold]);
        });


    //legend
    var legend = d3.select(target + " .chart svg")
        .append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) {
            return "translate(" + margin.left + ", 0)";
        });

    var offset = 20;

    //key
    var key = legend.append("g")
        .attr("class", "key")
        .attr("transform", function(d, i) {
            return "translate(" + (container.width - 150) + ", 6)";
        });

    key.append("rect")
        .attr("height", 37)
        .attr("width", 150)
        .attr("x", 0)
        .attr("fill", "white")
        .attr("fill-opacity", 0.9);

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
        .attr("x", container.width/2)
        .attr("y", -5)
        .attr("class", "title")
        .text(field);

    function selectArea(d, i) {
        $(target + ' .bar-group').not(':eq('+i+')').find("rect").attr("fill-opacity", "0.15");
        tip.show(util.mouse.x, util.mouse.y, field, d.key, d.values);
    }

    function deselectArea() {
        $(target + ' .bar-group rect').attr("fill-opacity", "1.0");
        tip.hide();
    }

}
