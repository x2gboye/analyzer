function DetailViewModel(parent, data) {

    var self = this;

    self.parent = parent;

    self.data = data;

    self.mappings = parent.mappings;

    self.columns = d3.keys(self.data[0]);

    self.container = $('#detail').find('iframe');

    /* Public Methods ------------------------------------------------------------------------------------------------
     ---------------------------------------------------------------------------------------------------------------- */

    self.init = function(iframe) {
        filterColumns();
        if(iframe) {
            tabulate(iframe);
        }
        self.resize();
    };

    self.resize = function() {
        var windowW = $(window).width();
        var windowH = $(window).height();
        var height = (windowW<1024) ? (windowH - 84) : (windowH - 32);
        self.container.css("height", height + "px");
        self.parent.loaded();
    };


    /* Private Methods ------------------------------------------------------------------------------------------------
     ---------------------------------------------------------------------------------------------------------------- */


    //remove extraneous columns (ex. "Quote Year Created", "Quote Year and Month Created")
    //as defined in mapping.js
    function filterColumns() {

        var columns = self.columns;

        var ignore = [];

        self.mappings.forEach(function(v, i) {
            if(v.ignore) {
                ignore.push(v.value);
            }
        });

        var len = ignore.length;

        while (len--) {
            var remove = columns.indexOf(ignore[len]);
            if(remove > -1) {
                columns.splice(remove, 1);
            }
        }

        columns.sort();

        self.columns = columns;
    }

    //append the iframe's body with the table
    function tabulate(iframe) {

        /*var mydata = [];

        var i,j,temparray,chunk = 20;
        for (i=0,j=self.data.length; i<j; i+=chunk) {
            temparray = self.data.slice(i,i+chunk);
            mydata.push(temparray);
        }*/

        var table = iframe.append("table"),
            thead = table.append("thead"),
            tbody = table.append("tbody");

        table.attr("class", "table table-bordered");

        // append the header row
        thead.append("tr")
            .selectAll("th")
            .data(self.columns)
            .enter()
            .append("th")
            .text(function(column) { return column; });

        // create a row for each object in the data
        var rows = tbody.selectAll("tr")
            .data(self.data)
            .enter()
            .append("tr");

        //rows.exit().remove();

        // create a cell in each row for each column
        var cells = rows.selectAll("td")
            .data(function(row, i) {
                return self.columns.map(function(column) {
                    return {column: column, value: row[column]};
                });
            })
            .enter()
            .append("td")
            .text(function(d) {
                return d.value;
            });

        return table;
    }

}