var ANLZ = ANLZ || {};
ANLZ.chart = ANLZ.chart || {};

ANLZ.chart.grid= function (field, data, target) {

    var filter = ANLZ.filter;

    if(target != "#timeline") {
        data = data.sort(function(a, b) {
            return b.values["Number of Quotes"] - a.values["Number of Quotes"];
        });
    }
    else {
        data = filter.saleMade(data);
    }

    var grid = d3.select(target + " .chart")
        .append("table")
        .attr("class", "table table-hover")

    var headRow = grid.append("thead")
        .append("tr");

    headRow.append("th")
        .text(field);

    for (i = 0; i < d3.keys(data[0].values).length; i++) {
        var key = d3.keys(data[0].values)[i];
        headRow.append("th")
            .attr("class", "text-right")
            .text(key.split('_').join(' '));
    }

    var tbody = grid.append("tbody");

    var row = tbody.selectAll("tr")
        .data(data)
        .enter().append("tr")
        .on("click", function(d) {
            filter.add(field, d.key);
            if(target === "#prospects" || target === "#timeline") {
                filter.skipField(field);
            }
        });

    row.append("td")
        .text(function(d) {
            return d.key;
        });

    for (i = 0; i < d3.keys(data[0].values).length; i++) {
        var key = d3.keys(data[0].values)[i],
            moneyFormat = function(n, currency) {
                return currency + n.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
            },
            isTotal = function(key) {
                return key.indexOf("Total") != -1;
            };
        row.append("td")
            .attr("class", "text-right")
            .text(function(d) {
                return (isTotal(key)) ? moneyFormat(d.values[key], "$") : d.values[key];
            });
    }

};