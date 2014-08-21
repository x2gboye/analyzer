var ANLZ = ANLZ || {};

ANLZ.search = {

    showSaveBtn: function(filterCount) {
        var controls = $('#filters').find('.controls'),
            btn = $('#saveSearch');
        if(filterCount>0) {
            controls.show();
            btn.removeAttr("disabled");
        }
        else {
            controls.hide();
            btn.attr("disabled", "disabled");
        }
    },

    save: function() {

        var self = this,
            salespeople = $('#salespeople'),
            prospects = $('#prospects'),
            timeline = $('#timeline'),
            data = {
                name: '',
                filter: ANLZ.filter.fields,
                salespeople: {
                    "total-select": salespeople.find(".total-select button.active").data("total"),
                    "chart-select": salespeople.find(".chart-select button.active").data("viz")
                },
                prospects: {
                    "total-select": prospects.find(".total-select button.active").data("total"),
                    "chart-select": prospects.find(".chart-select button.active").data("viz"),
                    "field-select": prospects.find(".field-select li.active a").data("key")
                },
                timeline: {
                    "total-select": timeline.find(".total-select button.active").data("total"),
                    "chart-select": timeline.find(".chart-select button.active").data("viz"),
                    "range-select": timeline.find(".range-select li.active a").data("key")
                }
            };

        if (!Modernizr.localstorage) {
            alert("You need to use a browser with Local Storage support to save your searches.");
        }
        else {
            bootbox.prompt("Give your search criteria a name:", function (name) {
                if (name) {
                    data.name = name;
                    var utc = new Date().getTime(),
                        key = "analyzer." + utc,
                        JsonString = JSON.stringify(data);

                    localStorage.setItem(key, JsonString);//save search criteria to LS
                    self.showCount();
                    self.load();
                    self.saveEffect();
                }
            });
        }

    },

    load: function () {
        var self = this,
            data = [],
            keys = [];
        for (var i = 0; i < localStorage.length; i++){
            var key = localStorage.key(i);
            if(key.substr(0, key.indexOf(".")) === "analyzer") {
                var item = JSON.parse(localStorage.getItem(localStorage.key(i)));
                data.push(item);
                keys.push(localStorage.key(i));
            }
        }

        $("#saved").find("tbody").empty();

        var tr = d3.select("#saved tbody")
            .selectAll("tr")
            .data(data)
            .enter().append("tr")
            .attr("data-key", function(d, i) {
                return keys[i];
            });

        tr.append("td")
            .text(function(d) {
                return d["name"];
            })
            .on("click", function(d, i) {
                self.select(keys[i]);
                $('#saved').find('tr').removeClass("active");
                $(d3.select(this).node().parentNode).addClass("active");
            });

        tr.append("td")
            .attr("class", "action")
            .append("button")
            .attr("class", "btn btn-default btn-xs remove")
            .on("click", function(d, i) {
                self.delete(keys[i], data[i]["name"]);
            })
            .append("i")
            .attr("class", "glyphicon glyphicon-remove");

        this.showCount();
    },

    select: function (key) {

        var item = JSON.parse(localStorage.getItem(key)),
            filter = item["filter"];

        delete item["filter"];
        delete item["name"];

        $(".total-select button, .chart-select button").removeClass("active");

        $.each(item, function(k, v) {
            var id = k,
                data = v,
                el = $('#'+id);
            el.find('.total-select button[data-total="' + data["total-select"] +'"]').addClass("active");
            el.find('.chart-select button[data-viz="' + data["chart-select"] +'"]').trigger("mouseup").addClass("active");
            if(id === "prospects" || id === "timeline") {
                var field = (id==="prospects") ? "field" : "range";
                field = data["" + field + "-select"];
                el.data("key", field);
                el.find('.dropdown-toggle span.text').text(field);
                el.find('.dropdown-menu li').removeClass("active");
                el.find('.dropdown-menu li a[data-key="' + field + '"]').parent().addClass("active");
            }
        });

        ANLZ.filter.clear();

        //console.log(filter[0]);

        ANLZ.filter.add(filter);

    },

    delete:  function (key, name) {
        var self = this;
        bootbox.dialog({
            message: "Are you sure you want to delete " + name + "?",
            buttons: {
                main: {
                    label: "Cancel",
                    className: "btn-default",
                    callback: function() {
                        return;
                    }
                },
                danger: {
                    label: "Delete Search",
                    className: "btn-danger",
                    callback: function() {
                        localStorage.removeItem(key);
                        $('#saved').find('tbody tr[data-key="' + key + '"]').remove();
                        self.showCount();
                    }
                }
            }
        });
    },

    showCount: function () {
        var savedCount = $('#savedCount'),
            count = 0;
        for (var i = 0; i < localStorage.length; i++){
            var key = localStorage.key(i);
            if(key.substr(0, key.indexOf(".")) === "analyzer") {
                count++;
            }
        }
        savedCount.text(count);
    },

    saveEffect: function () {
        var savedCount = $('#savedCount');
        $('.chart').effect( "transfer", { to: savedCount }, 750);
        savedCount.effect( "highlight", {color:"#7ab02c"}, 2000);
    }

};
