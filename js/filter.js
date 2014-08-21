var ANLZ = ANLZ || {};

ANLZ.filter = {

    fields: {},

    add: function (key, value) {

        var self = this;

        if (typeof(key) === "object") {
            $.each(key, function (k, v) {
                setFilterRow(k, v);
            });
        }
        else {
            setFilterRow(key, value);
            $('#searchTabs').find('a[href="#filters"]').tab('show');
            $('#saved').find('tr').removeClass("active");
        }

        function setFilterRow(k, v) {

            d3.selectAll("#filters table tbody tr").each(function () {

                var that = d3.select(this),
                    row = that.datum();

                if (row === k) {
                    that.attr("class", "")
                        .select("td.value")
                        .text(v);
                    self.fields[row] = v;

                    that.select("button.remove")
                        .on("click", function (d) {
                            d3.select(this.parentNode.parentNode).attr("class", "hide");
                            delete self.fields[row];
                            self.set();
                            ANLZ.search.showSaveBtn(d3.keys(self.fields).length);
                            $('#saved').find('tr').removeClass("active");
                        });
                }

            });

        }

        this.set();
        ANLZ.search.showSaveBtn(d3.keys(this.fields).length);

    },

    data: function () {

        var filteredData = ANLZ.init.data,
            filterCount = d3.keys(this.fields).length;

        if (filterCount > 0) {
            for (i = 0; i < filterCount; i++) {
                var key = d3.keys(this.fields)[i],
                    value = this.fields[key];

                filteredData = filteredData.filter(function (d) {
                    return (d[key] === value);
                });
            }
        }

        var len = filteredData.length;
        $('#rowCount').text(len).css("background", this.rowCountWarning(len).color);

        return filteredData;
    },

    set: function () {
        var self = this;

        d3.selectAll(".chart-select button.active").each(function () {
            var btn = $(d3.select(this).node()),
                id = btn.parents('.widget').attr('id');
            ANLZ.chart.select(btn, self.data());
        });
    },

    saleMade: function (data) {
        var rangeField = $("#timeline").data("key");
        if (rangeField.substr(0, 12) === "Sale Written") {
            data = data.filter(function (d) {
                return (d.key != "");
            });
        }
        return data;
    },

    rowCountWarning: function (rows) {
        var color,
            message;
        if (rows > 5000) {
            color = "red";
            message = "This could take a minute.";
        }
        else {
            color = "#f0ad4e";
            message = "Should just be a few seconds.";
        }
        if (rows <= 1000) {
            color = "green";
            message = "";
        }
        return {color: color, message: message};
    },


    skipField: function (field) {
        var active = $('.dropdown-menu li a[data-key="' + field + '"]'),
            next = active.parent().next().children('a');
        next.d3Click();
    },

    saveChart: function (btn) {
        var id = btn.parents('.widget').attr('id'),
            chartType = btn.data('viz');
        $.cookie(id, chartType, { expires: 7 });
    },

    clear: function () {
        this.fields = {};
        $("#filters").find("table tbody tr").each(function () {
            $(this).addClass("hide");
        });
    }

};
