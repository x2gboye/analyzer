function pieChart(parent, data) {

    var self = this;

    self.parent = parent;
    self.root = self.parent.root;
    self.key = self.parent.key;
    self.id = self.parent.id;

    self.widget = self.parent.widget;
    self.total = self.parent.total;
    self.sold = self.parent.sold;
    self.isPrem = self.parent.isPrem;
    self.color = self.parent.color();

    var margin = self.parent.margin;
    var container = self.parent.sizeContainers(self.widget);


    /* Public Methods ------------------------------------------------------------------------------------------------
     ---------------------------------------------------------------------------------------------------------------- */

    self.init = function () {

        initSettings();
        drawSVG();

        /*drawRect(self.total, self.color[0]);
        drawRect(self.sold, self.color[1]);
         */
        drawLegend();

        initEvents();

    };


    /* Private Methods ------------------------------------------------------------------------------------------------
     ---------------------------------------------------------------------------------------------------------------- */

    function initSettings() {

        var radius = Math.min(container.width, container.height) / 2,
            labelr = radius - 40;

        var pie = d3.layout.pie()
            .value(function (d) {
                return d.values[self.total];
            })
            .sort(null);

        var arc = d3.svg.arc()
            .outerRadius(radius)
            .innerRadius(0);

        var arcLabel = function (arc) {
            var c = arc,
                x = c[0],
                y = c[1],
                h = Math.sqrt(x * x + y * y), // pythagorean theorem for hypotenuse
                labelX = x / h * labelr,
                labelY = y / h * labelr;
            return { x: labelX, y: labelY };
        };

        var sum = d3.sum(data, function (d) {
            return d.values[self.total];
        });

        self.pie = pie;
        self.arc = arc;
        self.arcLabel = arcLabel;
        self.sum = sum;

    }


    function drawSVG() {

        var svg = d3.select("#" + self.id + " .chart")
            .append("svg")
            .attr("width", container.width + margin.left + margin.right)
            .attr("height", container.height + margin.top + margin.bottom)
            .attr("viewBox", "0, 0, " + (container.width + margin.left + margin.right) + ", " + (container.height + margin.top + margin.bottom));
            //.attr("preserveAspectRatio", "xMinYMid")


        var chart = svg.append("g")
            .attr("class", "pie")
            .attr("transform", "translate("
                + (container.width + margin.left + margin.right) / 2
                + ","
                + (container.height + margin.top + margin.bottom) / 2 + ")");


        var arcGroup = chart.selectAll(".arc")
            .data(self.pie(data))
            .enter().append("g")
            .attr("class", "arc");

        //pie slice
        var pieSlice = arcGroup.append("path")
            .attr("class", "slice")
            .attr("fill", function (d, i) {
                return self.color[i];
            })
            .attr("stroke", "white")
            .attr("d", d3.svg.arc().outerRadius(0).innerRadius(0))
            .transition()
            .duration(500)
            .attr("d", self.arc);


        //label
        var label = arcGroup.append("text")
            .attr("class", "pieLabel")
            .attr("transform", function (d) {
                var label = self.arcLabel(self.arc.centroid(d));
                return "translate(" + label.x + ',' + label.y + ")";
            })
            .attr("text-anchor", "middle");

        label.append("tspan")
            .attr("x", 0)
            .attr("dy", "1em")
            .text(function (d) {
                if (Math.round((d.value / self.sum) * 100) > 2) {
                    if (self.isPrem) {
                        var amount = Math.round(d.value),
                            M = amount / 1000000,
                            K = amount / 1000;
                        if (M >= 1) {
                            return "$" + M.toFixed(2) + "M";
                        }
                        else if (K >= 1) {
                            return "$" + Math.round(K) + "K";
                        }
                        else {
                            return "$" + amount;
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

        //Title
        var title = svg.append("text")
            .attr("x", (container.width + margin.left + margin.right) / 2)
            .attr("y", margin.top - 5)
            .attr("class", "title")
            .text(self.key);


        self.svg = svg;
        self.arcGroup = arcGroup;
    }


    function drawLegend() {

        //legend
        var legend = self.svg.append("g")
            .attr("class", "legend")
            .attr("transform", function (d, i) {
                return "translate(" + margin.left + ", 0)";
            });

        var j = 0,
            offset = 20;

        //key
        var key = legend.selectAll(".key")
            .data(self.pie(data))
            .enter().append("g")
            .attr("class", "key")
            .attr("transform", function (d, i) {
                var limit = Math.ceil(container.height / offset);
                if (i >= limit) {
                    j++;
                    return "translate(90, " + (offset * j) + ")";
                }
                else {
                    return "translate(0, " + (offset * (i + 1)) + ")";
                }
            });

        key.append("rect")
            .attr("height", offset)
            .attr("width", 90)
            .attr("x", 0)
            .attr("y", -(offset - 12) / 2)
            .attr("fill", "white");

        key.append("rect")
            .attr("height", 12)
            .attr("width", 12)
            .attr("x", 0)
            .attr("fill", function (d, i) {
                return self.color[i];
            });

        j = 0;

        key.append("text")
            .attr("dy", "1em")
            .attr("x", offset - 4)
            .text(function (d) {
                var key = d.data.key,
                    len = key.length,
                    limit = Math.ceil(container.height / offset);
                if (data.length > limit) {
                    j++;
                    if (len > 10) {
                        key = key.substr(0, 10) + "...";
                    }
                }
                return key;
            });

        self.legendKey = key;
    }


    function initEvents() {

        self.arcGroup.on("mousemove", function (d, i) {
            var mX = self.root.mouse.x,
            mY = self.root.mouse.y;
            selectArea(data[i], i, mX, mY);
        })
        .on("mouseleave", function () {
            deselectArea();
        })
        .on("click", function (d) {
            var filter = { key: self.key, value: d.data.key };
            self.root.addFilter(filter, true);
            if (self.id === "variable" || self.id === "timeline") {
                self.parent.skipField();
            }
            self.root.hideTip();
        });

        self.legendKey.on("click", function (d) {
            //console.log(self.key + ": " + d.data.key + ", Prospects: " + d.value);
            var filter = { key: self.key, value: d.data.key };
            self.root.addFilter(filter, true);
            if (self.id === "variable") {
                self.parent.skipField();
            }
            self.root.hideTip();
        })
        .on("mouseenter", function (d, i) {
            var arc = $("#"+self.id).find(".pie .arc").eq(i),
                txt = arc.find("text");
                mX = Math.round(txt.offset().left),
                mY = Math.round(txt.offset().top - 15);
            selectArea(data[i], i, mX, mY);
        })
        .on("mouseleave", function () {
            deselectArea();
        });


    }


    function selectArea (d, i, mX, mY) {
        $("#" + self.id + ' .slice').not(':eq(' + i + ')').attr("fill-opacity", "0.25");
        $("#" + self.id + ' .legend .key').not(':eq(' + i + ')').find("rect").attr("fill-opacity", "0.25");
        $("#" + self.id + ' .legend .key').not(':eq(' + i + ')').find("text").attr("fill-opacity", "0.25");
        self.root.showTip(mX, mY, d.key, d.values);
    }

    function deselectArea () {
        $("#" + self.id + ' .slice').attr("fill-opacity", "1.0");
        $("#" + self.id + ' .legend .key').find("rect").add("text").attr("fill-opacity", "1.0");
        self.root.hideTip();
    }


}