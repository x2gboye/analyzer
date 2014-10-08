function SearchViewModel(parent, key, name) {

    var self = this;

    self.parent = parent;

    self.key = key;

    self.name = name;

    var table = d3.select("#saved > table > tbody");


    /* Public Methods ------------------------------------------------------------------------------------------------
     ---------------------------------------------------------------------------------------------------------------- */

    self.add = function() {

        var tr = table.append("tr")
            .attr("data-key", self.key);

        tr.append("td")
            .on("click", function() {
                self.parent.loadSearch(self.key);
            })
            .text(self.name);

        tr.append("td")
            .attr("class", "action")
            .append("button")
            .attr("class", "btn btn-default btn-xs remove")
            .on("click", function() {
                self.parent.removeSearch(self.name, self.key);
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