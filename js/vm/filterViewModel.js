function FilterViewModel(parent, key, value) {

    var self = this;

    self.parent = parent;

    self.key = key;
    self.value = value;

    var table = d3.select("#filters > table > tbody");


    /* Public Methods ------------------------------------------------------------------------------------------------
     ---------------------------------------------------------------------------------------------------------------- */

    self.add = function() {

        var tr = table.append("tr")
            .attr("data-key", self.key);

        tr.append("td").text(self.key);

        tr.append("td").text(self.value);

        tr.append("td")
            .attr("class", "action")
            .append("button")
            .attr("class", "btn btn-default btn-xs remove")
            .on("click", function() {
                self.parent.removeFilter(self.key);
            })
            .append("i")
            .attr("class", "glyphicon glyphicon-remove");

    };

    self.remove = function() {
        table.selectAll('tr[data-key="' + self.key  + '"]').remove();
    };

    /* Private Methods ------------------------------------------------------------------------------------------------
     ---------------------------------------------------------------------------------------------------------------- */

}
