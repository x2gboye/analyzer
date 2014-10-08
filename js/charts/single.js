function singleChart(parent, data) {

    var self = this;

    self.parent = parent;
    self.root = self.parent.root;
    self.key = self.parent.key;
    self.id = self.parent.id;

    self.widget = self.parent.widget;
    self.total = self.parent.total;
    self.sold = self.parent.sold;
    self.isPrem = self.parent.isPrem;
    self.color = self.parent.colorPrem(self.isPrem);

    var margin = self.parent.margin;
    var container = self.parent.sizeContainers(self.widget);


    var q = data[0].values["Number of Quotes"],
        qS = data[0].values["Number of Quotes Sold"],
        p = data[0].values["Total Premium Quoted"],
        pS = data[0].values["Total Premium Sold"],
        data = {
            quotes: [],
            premium: []
        };

    data.quotes.push(q - qS);
    data.quotes.push(qS);
    data.premium.push(p - pS);
    data.premium.push(pS);


    /* Public Methods ------------------------------------------------------------------------------------------------
     ---------------------------------------------------------------------------------------------------------------- */

    self.init = function () {

        initSettings();
        drawSVG();

    };


    /* Private Methods ------------------------------------------------------------------------------------------------
     ---------------------------------------------------------------------------------------------------------------- */

    function initSettings() {

        var radius = Math.min(container.width, container.height)/4,
            labelr = radius - 40;

        var pie = d3.layout.pie()
            .value(function(d) {
                return d;
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

        var table = $("#" + self.id + " .chart table");

        self.radius = radius;
        self.pie = pie;
        self.arc = arc;
        self.arcLabel = arcLabel;
        self.table = table;

    }


    function drawSVG() {

        var svg = d3.select("#" + self.id + " .chart")
            .append("svg")
            .attr("width", container.width + margin.left + margin.right)
            .attr("height", container.height - self.table.height() + 40)
            .attr("viewBox", "0, 0, " + (container.width + margin.left + margin.right) + ", " + (container.height - self.table.height() + 40));

        for(j=0; j<d3.keys(data).length; j++) {

            var isPrem = (j===0) ? false : true,
                color = self.parent.colorPrem(isPrem);

            var chart = svg.append("g")
                .attr("class", "pie")
                .attr("transform", function() {
                    var x = (container.width/(2-j)) - self.radius/2,
                        y = self.radius+10;
                    return "translate(" + x + "," + y + ")";
                });

            var g = chart.selectAll(".arc")
                .data(function() {
                    var val = (isPrem) ? data.premium : data.quotes;
                    return self.pie(val);
                })
                .enter().append("g")
                .attr("class", "arc");

            //pie slice
            g.append("path")
                .attr("class", "slice no-hover")
                .attr("fill", function(d, i) {
                    return color[i];
                })
                //.attr("stroke", "white")
                .attr("d", d3.svg.arc().outerRadius(0).innerRadius(0))
                .transition()
                .duration(500)
                .attr("d", self.arc);

            //label
            var label = g.append("text")
                .attr("class", "pieLabel")
                .attr("transform", function(d) {
                    var label = self.arcLabel(self.arc.centroid(d));
                    return "translate(" + label.x +  ',' + label.y +  ")";
                })
                .attr("text-anchor", "middle")
                .text(function(d, i) {
                    if(i==1) {
                        var val = (isPrem) ? p : q,
                            percent = Math.round((d.value/val) * 100);
                        return percent + "%";
                    }
                });

            chart.append("text")
                .attr("class", "title")
                .attr("y", function() {
                    return self.radius+20;
                })
                .text(function() {
                    var t = (isPrem) ? "Premium" : "Quotes";
                    return "% of " + t + " sold";
                });

        }


    }

}