var ANLZ = ANLZ || {};
ANLZ.chart = ANLZ.chart || {};

//PIE CHART

ANLZ.chart.pie = function (field, data, target) {

    var total = $(target).find('.total-select button.active').data("total"),
        sold = $(target).find('.total-select button.active').data("sold"),
        isPrem = (total.indexOf("Premium") == -1) ? false : true,
        settings = ANLZ.settings,
        util = ANLZ.util,
        filter = ANLZ.filter,
        tip = ANLZ.tip,
        color = settings.color(),
        container = util.sizeContainers(target),
        margin = settings.margin;

    data = data.sort(function(a, b) {
        return b.values[total] - a.values[total];
    });

    var chart = d3.select(target + " .chart")
        .append("svg")
        .attr("width", container.width + margin.left + margin.right)
        .attr("height", container.height + margin.top + margin.bottom)
        .attr("viewBox", "0, 0, " + (container.width + margin.left + margin.right) + ", " + (container.height + margin.top + margin.bottom))
        //.attr("preserveAspectRatio", "xMinYMid")
        .append("g")
        .attr("class", "pie")
        .attr("transform", "translate("
            + (container.width + margin.left + margin.right)/2
            + ","
            + (container.height + margin.top + margin.bottom)/2 + ")");


    var radius = Math.min(container.width, container.height) / 2,
        labelr = radius - 40;

    var pie = d3.layout.pie()
        .value(function(d) {
            return d.values[total];
        })
        .sort(null);

    var arc = d3.svg.arc()
        .outerRadius(radius)
        .innerRadius(0);

    var arcLabel= function(arc) {
        var c = arc,
            x = c[0],
            y = c[1],
            h = Math.sqrt(x*x + y*y), // pythagorean theorem for hypotenuse
            labelX = x/h * labelr,
            labelY = y/h * labelr;
        return { x: labelX, y: labelY };
    };

    var g = chart.selectAll(".arc")
        .data(pie(data))
        .enter().append("g")
        .attr("class", "arc")
		.on("mousemove", function (d, i) {
            var mX = util.mouse.x,
                mY = util.mouse.y;
            selectArea(data[i], i, mX, mY);
        })
        .on("mouseleave", function () {			
            deselectArea();
        });

    //pie slice
    g.append("path")
        .attr("class", "slice")
        .attr("fill", function(d, i) { return color[i]; })
        .attr("stroke", "white")
        .attr("d", d3.svg.arc().outerRadius(0).innerRadius(0))
        .on("click", function(d) {
            filter.add(field, d.data.key);
            if(target === "#prospects" || target === "#timeline") {
                filter.skipField(field);
            }
            tip.hide();
        })
        .transition()
        .duration(500)
        .attr("d", arc);

    var total= d3.sum(data, function(d){
        return d.values[total];
    });

    //label
    var label = g.append("text")
        .attr("class", "pieLabel")
        .attr("transform", function(d) {
            var label = arcLabel(arc.centroid(d));
            return "translate(" + label.x +  ',' + label.y +  ")";
        })
        .attr("text-anchor", "middle");

    label.append("tspan")
        .attr("x", 0)
        .attr("dy", "1em")
        .text(function(d) {
            if (Math.round((d.value/total)*100) > 2) {
                if(isPrem) {
                    var amount = Math.round(d.value),
                        M = amount / 1000000,
                        K = amount / 1000;
                    if(M>=1) {
                        return "$"+ M.toFixed(2)+"M";
                    }
                    else if(K>=1) {
                        return "$"+Math.round(K)+"K";
                    }
                    else {
                        return "$"+amount;
                    }
                }
                else {
                    return d.value;
                }
            }
            else {
                return "";
            }
        });

    /*label.append("tspan")
        .attr("x", 0)
        .attr("dy", "1em")
        .text(function(d) {
            return (Math.round((d.value/total)*100) > 2) ? d.value : "";
        });*/


    //legend
    var legend = d3.select(target + " .chart svg")
        .append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) {
            return "translate(" + margin.left + ", 0)";
        });

    var j = 0,
        offset = 20;

    //key
    var key = legend.selectAll(".key")
        .data(pie(data))
        .enter().append("g")
        .attr("class", "key")
        .attr("transform", function(d, i) {
            var limit = Math.ceil(container.height/offset);
            if(i >= limit) {
                j++;
                return "translate(90, " + (offset * j) + ")";
            }
            else {
                return "translate(0, " + (offset * (i + 1)) + ")";
            }
        })
        .on("click", function(d) {
            //console.log(field + ": " + d.data.key + ", Prospects: " + d.value);
            filter.add(field, d.data.key);
            if(target === "#prospects") {
                filter.skipField(field);
            }
            tip.hide();
        })
        .on("mouseenter", function (d, i) {
            var node = d3.select(this).node(),
                arc = $(node).parent().prev().find(".arc").eq(i),
                txt = arc.find("text"),
                mX = Math.round(txt.offset().left),
                mY = Math.round(txt.offset().top-15);
            selectArea(data[i], i, mX, mY);
        })
        .on("mouseleave", function () {
            deselectArea();
        });

    key.append("rect")
        .attr("height", offset)
        .attr("width", 90)
        .attr("x", 0)
        .attr("y", -(offset-12)/2)
        .attr("fill", "white");

    key.append("rect")
        .attr("height", 12)
        .attr("width", 12)
        .attr("x", 0)
        .attr("fill", function(d, i) { return color[i]; });

    j=0;

    key.append("text")
        .attr("dy", "1em")
        .attr("x", offset-4)
        .text(function(d) {
            var key = d.data.key,
                len = key.length,
                limit = Math.ceil(container.height/offset);
            if(data.length > limit) {
                j++;
                if(len>10) {
                    key = key.substr(0, 10) + "...";
                }
            }
            return key;
        });

    //Title
    d3.select(target + " .chart svg").append("text")
        .attr("x", (container.width + margin.left + margin.right)/2)
        .attr("y", margin.top - 5)
        .attr("class", "title")
        .text(field);

    function selectArea(d, i, mX, mY) {
        $(target + ' .slice').not(':eq('+i+')').attr("fill-opacity", "0.25");
        $(target + ' .legend .key').not(':eq('+i+')').find("rect").attr("fill-opacity", "0.25");
        $(target + ' .legend .key').not(':eq('+i+')').find("text").attr("fill-opacity", "0.25");
        tip.show(mX, mY, field, d.key, d.values);
    }

    function deselectArea() {
        $(target + ' .slice').attr("fill-opacity", "1.0");
        $(target + ' .legend .key').find("rect").add("text").attr("fill-opacity", "1.0");
        tip.hide();
    }


};
