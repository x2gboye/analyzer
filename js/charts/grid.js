function grid(parent, data) {

    var self = this;

    self.parent = parent;
    self.root = self.parent.root;
    self.key = self.parent.key;
    self.id = self.parent.id;




    /* Public Methods ------------------------------------------------------------------------------------------------
     ---------------------------------------------------------------------------------------------------------------- */

    self.init = function () {

        var grid = d3.select("#" + self.id + " .chart")
            .append("table")
            .attr("class", "table table-hover")

        var headRow = grid.append("thead")
            .append("tr");

        headRow.append("th")
            .text(self.key);

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
            .on("click", function (d) {
                var filter = { key: self.key, value: d.key };
                self.root.addFilter(filter, true);
                if (self.id === "prospects" || self.id === "timeline") {
                    self.parent.skipField();
                }
            });

        row.append("td")
            .text(function (d) {
                var key = (self.id === "timeline") ? self.parent.formatDate(d.key) : d.key;
                return key;
            });

        for (i = 0; i < d3.keys(data[0].values).length; i++) {
            var key = d3.keys(data[0].values)[i],
                moneyFormat = function (n, currency) {
                    return currency + n.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
                },
                isTotal = function (key) {
                    return key.indexOf("Total") != -1;
                };
            row.append("td")
                .attr("class", "text-right")
                .text(function (d) {
                    return (isTotal(key)) ? moneyFormat(d.values[key], "$") : d.values[key];
                });
        }

    };

    /* Private Methods ------------------------------------------------------------------------------------------------
     ---------------------------------------------------------------------------------------------------------------- */



}