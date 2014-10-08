
function AnlzViewModel() {
    var self = this;

    self.root = self;

    self.dataFile = "data/Quotes.csv?v=1";

    self.mapFile = "data/us.json?v=1";

    self.detailView = "detail.html?v=1";

    self.data;

    self.mappings = mappings.quotes;

    self.allSearches = [];
    self.searches = [];

    self.filters = [];

    self.allWidgets = [];
    self.widgets = [];

    self.details = [];

    self.maps = [];

    self.loader = $('.loading');

    self.saveBtn = $('#saveSearch');

    self.searchTab = $('#searchTab');

    self.activeTab = "drilldown";

    self.container = $('.container-fluid > .tab-pane');


    /* Public Methods ------------------------------------------------------------------------------------------------
     ---------------------------------------------------------------------------------------------------------------- */

    //Show the loading overlay
    self.loading = function(html) {
        var content = $('.loading > div');
        var widget = $('.widget');

        if (html) {
            content.html(html);
        }
        else {
            content.html("Loading...");
        }

        self.container.css("visibility", "hidden");
        self.loader.show();
    };

    //Hide the loading overlay
    self.loaded = function() {
        self.container.css("visibility", "visible");
        self.loader.hide();
    };

    //nest data according to it's rollup fields
    self.nestData = function(key, data) {

        var nest = d3.nest()
            .key(function (d) {
                return d[key];
            })
            .sortKeys(d3.ascending)
            .rollup(function(leaves) {

                var obj = {},
                    rollup = self.rollup();

                rollup.forEach(function(v, i) {
                    if(v.count) {
                        obj[v.value] = leaves.length;
                    }
                    else {
                        obj[v.value] = d3.sum(leaves, function (d) { return d[v.value]; });
                    }
                });

                return obj;
            })
            .entries(data);

        return nest;
    };

    //get rollup fields as defined in mappings.js
    self.rollup = function() {

        var rollup = [];

        self.mappings.forEach(function(v, i) {
            if(v.rollup) {
                rollup.push(v);
            }
        });

        return rollup;

    };

    //object for storing mouse position info
    self.mouse = { x: 0, y: 0 };

    //update tip position and data
    self.showTip = function (left, top, key, values) {

        var tip = $("#chartTip"),
            keyTD = tip.find(".key"),
            valueTD = tip.find(".value"),
            moneyFormat = function(n, currency) {
                return currency + n.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
            },
            isTotal = function(key) {
                return key.indexOf("Total") != -1;
            };

        keyTD.text(key);
        valueTD.text(values.total);

        tip.find("tbody").empty();

        for (i = 0; i < d3.keys(values).length; i++) {
            var key = d3.keys(values)[i],
                value = (isTotal(key)) ? moneyFormat(values[key], "$") : values[key];
            tip.find("tbody").append('<tr><td>' + key + '</td><td class="text-right">' + value + '</td></tr>');
        }

        var tipW = tip.width()+30,
            tipH = tip.outerHeight(),
            winW = $(window).width(),
            winH = $(window).height(),
            wDiff = Math.ceil(winW-tipW),
            hDiff = Math.ceil(winH-tipH);

        if(Math.ceil(top-tipH) > 0) {
            top = top-tipH;
        }

        if(Math.ceil(left) >= wDiff) {
            left = left-tipW+10;
        }
        else {
            left = left+30;
        }


        tip.css({
            top: top + "px",
            left: left + "px"
        });

        tip.show();
    };

    //hide the tip
    self.hideTip = function () {
        var tip = $("#chartTip");
        tip.hide();
    };

    //add a data filter
    self.addFilter = function(filter, originalEvent) {
        var key = filter.key;
        var value = filter.value;

        if(!checkDupFilter(key)) {
            var filter = new FilterViewModel(self, key, value);
            self.filters.push(filter);
            filter.add();
            if(originalEvent) {
                updateData();
                $('#searchTabs').find('a[href="#filters"]').tab('show');
            }
        }

        enableSave();
    };

    //remove a data filter
    self.removeFilter = function(key) {
        self.filters.forEach(function(v, i) {
           if(v.key === key) {
               self.filters[i].remove();
               self.filters.splice(i, 1);
           }
        });
        updateData();
        enableSave();
    };

    //remove a saved search
    self.removeSearch = function(name, key) {

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
                        self.searches.forEach(function(v, i) {
                            if(v.key === key) {
                                self.searches[i].remove();
                                self.searches.splice(i, 1);
                            }
                        });
                        localStorage.removeItem(key);
                        saveCount(true);
                    }
                }
            }
        });

    };

    //load a saved search
    self.loadSearch = function(key) {

        //retrieve the storded json from localStorage
        for (var i = 0; i < localStorage.length; i++) {
            if(key === localStorage.key(i)) {
                var item = JSON.parse(localStorage.getItem(localStorage.key(i)));
            }
        }

        if(item) {

            //update the chart viewModels with stored values
            item.widgets.forEach(function(v, i) {
                var widget = self.widgets.filter(function(val) {
                    return val.id === v.id;
                });
                widget = widget[0];
                widget.setKey(v.key);
                widget.setChartType(v.chartType, true);
            });

            //remove any filter viewModels
            self.filters.forEach(function(v, i) {
                self.filters[i].remove();
                self.filters.splice(i, 1);
            });

            //add new filter viewModels for each saved filter
            item.filters.forEach(function(v, i) {
                self.addFilter(v, false);
            });

            updateData();
        }

    };

    //load the CSV data and call initial functions
    self.init = function() {

        initMouse();
        initTip();

        d3.csv(self.dataFile, function (error, rows) {
            if (error) return console.error(error);

            //map csv columns according to mappings.js definitions
            self.data = mapData(rows);

            //load viewModels
            initWidgets();
            initDetails();
            initMap();

            //Hide loading message
            self.loaded();

            //add event listeners
            onResize();
            initTabs();
            initD3events();

            if(Modernizr.localstorage) {
                initSave();
            }

        })
        .on("progress", function(event){
            //update progress bar
            if (d3.event.lengthComputable) {
                var percentComplete = Math.round(d3.event.loaded * 100 / d3.event.total);
                self.loader.find('> div').text("Loading: " + percentComplete + "%");
            }
        });

    };


    /* Private Methods ------------------------------------------------------------------------------------------------
    ---------------------------------------------------------------------------------------------------------------- */

    //initialize the three drilldown widgets
    function initWidgets() {
        self.allWidgets.forEach(function(v, i) {
            var widget = new WidgetViewModel(self, v.id, v.chartType, self.data);
            self.widgets.push(widget);
            widget.init();
        });
    };

    //initialize the detail view
    function initDetails() {
        var detail = new DetailViewModel(self, self.data);
        self.details.push(detail);
    }

    //initialize the map view
    function initMap() {
        var map = new MapViewModel(self,self.data);
        self.maps.push(map);
    }

    //formats date (m/d/yyyy -> yyyy-mm-dd)
    function formatDate(date) {
        var format = d3.time.format("%m/%d/%Y");

        date = format.parse(date);

        if (date) {
            var year = date.getFullYear(),
                month = addLeadingZero(date.getMonth() + 1),
                day = addLeadingZero(date.getDate());

            return year + "-" + month + "-" + day;
        }
        else {
            return "";
        }
    }

    //adds a leading 0 to a sigle digit number
    function addLeadingZero(num) {
        return (parseInt(num) < 10) ? "0" + num : num;
    }

    //converts a string to TitleCase.  Used for normalizing city names.
    function titleCase(s) {
        return s.toLowerCase().replace(/^(.)|\s(.)/g,
            function ($1) {
                return $1.toUpperCase();
            });
    }

    //formats data according to rules specified in mappings.js
    function formatData(d, v, i) {

        switch(v.type) {

            case "money":
                return parseFloat(d.value[v.value]);
                break;

            case "string":
                switch(v.format) {

                    case "titleCase":
                        return titleCase(d.value[v.value]);
                        break;

                    case "leadingZero":
                        return addLeadingZero(d.value[v.value]);
                        break;
                }
                break;

            case "date":

                switch(v.format) {

                    case "year":
                        return formatDate(d.value[v.key]).substr(0, 4);
                        break;

                    case "yearMonth":
                        return formatDate(d.value[v.key]).substr(0, 7);
                        break;

                    default:
                        return formatDate(d.value[v.value]);

                }
                break;

            default:
                return d.value[v.value];

        }

    }

    //map columns in each row of csv to appropriate key
    function mapData(rows) {
        var data = d3.entries(rows);

        data = data.map(function (d, i) {
            var obj = {};

            self.mappings.forEach(function(v, i) {
                if(!v.count) {
                    obj[v.value] = formatData(d, v, i);
                }
            });

            return obj;
        });
        setRowCount(data.length);
        return data;
    }

    //check for duplicate filter before adding
    function checkDupFilter(key) {
        var dup = false;
        self.filters.forEach(function(v, i) {
            if(v.key === key) {
                dup = true;
            }
        });
        return dup;
    }

    //activate save button if filters are present
    function initSave() {
        self.saveBtn
            .on("click", function() {
               saveSearch();
            })
            .parent().show();
        self.searchTab.show();

        //for dev purposes, remove old saved localStorage items
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            var utc = parseInt(key.substr(key.indexOf(".")+1, key.length));
            if(utc <= 1412724514611){
                localStorage.removeItem(key);
            }
        }

        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if(key.substr(0, key.indexOf(".")) === "analyzer") {
                var value = JSON.parse(localStorage[key]);
                var search = new SearchViewModel(self, key, value.name);
                self.searches.push(search);
                search.add();
            }
        }

        saveCount(false);

    }

    //activate save button if filters are present
    function enableSave() {
        self.saveBtn.attr("disabled", function() {
           return self.filters.length < 1;
        });
    }

    //save a filter set as a "search"
    function saveSearch() {

        var filters = [];
        self.filters.forEach(function(v, i) {
            var filter = {key: v.key, value: v.value};
            filters.push(filter);
        });

        var widgets = [];
        self.widgets.forEach(function(v, i) {
            var widget = { id: v.id, key: v.key, chartType: v.chartType };
            widgets.push(widget);
        });

        var data = {};

        bootbox.prompt("Give your search criteria a name:", function (name) {
            if (name) {
                data.name = name;
                data.filters = filters;
                data.widgets = widgets;
                var utc = new Date().getTime(),
                    key = "analyzer." + utc,
                    JsonString = JSON.stringify(data);

                localStorage.setItem(key, JsonString);//save search criteria to LS
                var search = new SearchViewModel(self, key, name);
                self.searches.push(search);
                search.add();
                saveCount(true);

            }
        });
    }

    //save a filter set as a "search"
    function saveCount(showEffect) {
        var txt = $('#savedCount');
        var oldCount = txt.text();
        var newCount = self.searches.length;

        if(showEffect) {
            if(newCount > oldCount) {
                $('#drilldown .chart').effect( "transfer", { to: txt }, 750);
                txt.effect( "highlight", {color:"#7ab02c"}, 2000);
            }
            else {
                txt.effect( "highlight", {color:"##D9534F"}, 2000);
            }
        }

        txt.text(newCount);

        return newCount;
    }

    //update the dataset when a filter is added, removed, etc
    function updateData() {
        var data = self.data;

        self.filters.forEach(function(v, i) {
            data = data.filter(function (d) {
                return (d[v.key] === v.value);
            });
        });

        self.widgets.forEach(function(v, i) {
            v.data = data;
            v.setChart();
        });

        self.details.forEach(function(v, i) {
            v.data = data;
        });

        setRowCount(data.length);
    }

    //update row count badge text
    function setRowCount(len) {
        var badge = $('#rowCount');
        badge.text(len);
        badge.css("background", getRowCount().color);
    }

    //get row count
    function getRowCount() {
        var count = $('#rowCount').text(),
            color,
            message;

        if (count <= 1000) {
            color = "green";
            message = "";
        }
        else if (count > 5000) {
            color = "red";
            message = "This could take a minute.";
        }
        else {
            color = "#f0ad4e";
            message = "Should just be a few seconds.";
        }
        return {count: count, color: color, message: message};
    }

    //add event listener to track mouse pointer location for rollover tips
    function initMouse() {
        document.addEventListener('mousemove', function (e) {
            self.mouse.x = (e.clientX || e.pageX) + (document.body.scrollLeft || document.documentElement.scrollLeft);
            self.mouse.y = (e.clientY || e.pageY) + (document.body.scrollTop || document.documentElement.scrollTop);
        }, false);
    }

    //add event listener for side tabs
    function initTabs() {

        var iframe = $("#detail").find("iframe");
        var tabs = $('nav a[data-toggle="tab"]');

        tabs.on('show.bs.tab', function(e) {
            $('.widget .chart').empty();
            iframe.attr("src", "");
        });

        tabs.on('shown.bs.tab', function (e) {


            var id = $(e.target).attr("href");

            id = id.replace("#", "");

            if (id === "detail") {

                var html = function () {
                    var warning = getRowCount(),
                        span = '<span class="badge" style="background: ' + warning.color + '">';
                        span += warning.count + '</span>';
                    return "Loading " + span + " rows.<br />" + warning.message;
                };
                self.loading(html);
                setTimeout(function () {
                    iframe.attr("src", self.detailView);
                }, 250);

            }

            else if(id === "map") {
                self.loading();
                self.maps.forEach(function(v, i) {
                    v.init();
                });
            }

            else {

                $(window).trigger("resize");

            }

            self.activeTab = id;


        });

    };

    //add html for holding rollover tip data
    function initTip() {

        var chartTip = '<div class="chart-tip" id="chartTip"><table>';
        chartTip += '<thead><tr><th class="key" colspan="2"></th></tr></thead>';
        chartTip += '<tbody></tbody>';
        chartTip += '</table></div>';

        $("body").prepend(chartTip);

    }

    //window resize event listener
    function onResize() {
        var id;

        $(window).on("resize", function () {

            self.loading();

            clearTimeout(id);

            id = setTimeout(function() {

                switch (self.activeTab) {

                    case "detail":
                        self.details.forEach(function (v, i) {
                            v.resize();
                        });
                        break;

                    case "map":
                        self.maps.forEach(function (v, i) {
                            v.resize();
                        });
                        break;

                    default:
                        self.widgets.forEach(function(v, i) {
                            v.sizeWidgets();
                            v.setChart();
                        });
                        break;
                }

            }, 250);

        });

    }

    //allow jQuery to fire d3 events
    function initD3events() {

        //click
        jQuery.fn.d3Click = function () {
            this.each(function (i, e) {
                var evt = document.createEvent("MouseEvents");
                evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                e.dispatchEvent(evt);
            });
        };

    }


};