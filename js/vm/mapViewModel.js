function MapViewModel(parent, data) {

    var self = this;

    self.parent = parent;

    self.data = data;

    self.container = $('#map').find('.chart');

    self.zoom = 6;

    self.centered = null;
    self.state = null;

    self.isInit = false;


    /* Public Methods ------------------------------------------------------------------------------------------------
     ---------------------------------------------------------------------------------------------------------------- */

    self.init = function() {


        d3.json(self.parent.mapFile, function (error, us) {

            if (error) return console.error(error);

            self.sData = topojson.feature(us, us.objects.states).features;
            self.pData = topojson.feature(us, us.objects.places).features;

            self.resize();
            self.parent.loaded();

        });


    };

    self.resize = function() {

        self.clearMap();

        var windowW = $(window).width();
        var windowH = $(window).height();
        var height = (windowW<1024) ? (windowH - 84) : (windowH - 32);

        self.container.css("height", height + "px");

        self.width = self.container.width();
        self.height = self.container.height();
        self.mapX = self.width/2;
        self.mapY = self.height/2;
        self.scale = Math.max(self.width, self.height);

        self.albers = d3.geo.albersUsa()
            .scale(self.scale)
            .translate([self.mapX, self.mapY])
            .precision(.1);

        self.mercator = d3.geo.mercator()
            .center([-96, 38.3])
            .scale(self.scale - 300)
            .translate([self.mapX, self.mapY]);

        self.tile = d3.geo.tile()
            .size([self.width, self.height]);

        drawSVG();
        drawStates();

        self.background.on("click", function() {
            stateClick();
        });

        self.parent.loaded();

    };


    self.clearMap = function() {
        self.container.empty();
    };

    /* Private Methods ------------------------------------------------------------------------------------------------
     ---------------------------------------------------------------------------------------------------------------- */

    //array of colors for the map
    function color() {
        var colors = [];
        colors = colors.concat(colorbrewer.Blues[6]);
        colors.reverse();
        return colors;
    }


    //create svg elements for the map
    function drawSVG() {

        var svg = d3.select("#usmap .chart").append("svg")
            .attr("width", self.width)
            .attr("height", self.height);

        var tiles = svg.append("g")
            .attr("id", "tiles")
            .attr("opacity", 0);

        var background = svg.append("rect")
            .attr("class", "background")
            .attr("width", self.width)
            .attr("height", self.height);

        var mapGroup = svg.append("g")
            .attr("id", "mapGroup")
            .attr("opacity", 0);

        var states = mapGroup.append("g")
            .attr("id", "states");

        var places = mapGroup.append("g")
            .attr("id", "places");

        self.svg = svg;
        self.tiles = tiles;
        self.background = background;
        self.mapGroup = mapGroup;
        self.states = states;
        self.places = places;

    }

    //Draw paths for each state
    function drawStates() {

        var data = self.sData,
            qLen = self.data.length,
            qStates = self.parent.nestData("Prospect State", self.data),
            arr = [];

        data = data.sort(function (a, b) {
            if (a.properties.state < b.properties.state) return -1;
            if (a.properties.state > b.properties.state) return 1;
            return 0;
        });

        $.each(data, function (i, v) {
            var s = qStates.filter(function (d) {
                return (d.key === v.properties.state);
            });
            if (s.length) {
                var numQuotes = s[0].values["Number of Quotes"],
                    percent = Math.round((numQuotes / qLen) * 100);
                arr.push(percent);
            }
        });

        arr.sort().reverse();

        var arr = arr.filter(function (elem, pos) {
            return arr.indexOf(elem) == pos;
        });

        self.states.selectAll("path")
            .data(data)
            .enter().append("path")
            .each(function (d, i) {

                var c,
                    s = d.properties.state,
                    p = qStates.filter(function (d) {
                        return (d.key === s);
                    }),
                    state = p[0];

                if (p.length) {
                    var numQuotes = state.values["Number of Quotes"],
                        percent = Math.round((numQuotes / qLen) * 100);
                    c = color()[arr.indexOf(percent)];
                }
                else {
                    c = "#dcdcdc";
                }

                d3.select(this)
                    .attr({
                        d: path(self.mercator),
                        class: function () {
                            var quoted = (p.length) ? "quoted" : "";
                            return "state " + quoted;
                        },
                        fill: c,
                        stroke: color()[1],
                        id: s
                    })
                    .on("click", function (d, i) {
                        stateClick(d, i, state);
                    })
                    .on("mousemove", function (d, i) {
                        if (state) {
                            selectArea(state.key, state.values, this);
                        }
                    })
                    .on("mouseleave", function () {
                        deselectArea();
                    });
            });

        self.states.selectAll("path")
            .each(function (d, i) {
                var that = d3.select(this),
                    node = that.node();

                d.properties["zWidth"] = Math.ceil(node.getBoundingClientRect().width * self.zoom);
                d.properties["zHeight"] = Math.ceil(node.getBoundingClientRect().height * self.zoom);

            });

        changeProjection(self.albers);

    }

    //changes map projection (albers vs mercator)
    function changeProjection(projection) {

        var n = 0;

        self.states.selectAll("path")
            .each(function () {
                n++;
            })
            .transition()
            .duration(0)
            .attr("d", path(projection))
            .each("end", function (d, i) {
                n--;
                if(n == 0) {
                    self.mapGroup.attr("opacity", 1);
                }
            });

    }

    //returns path descriptions based on supplied map projection (albers, mercator)
    function path(projection) {

        var path = d3.geo.path()
            .projection(projection)
            .pointRadius(2);

        return path;

    }

    //Zoom in/out when state with quotes is clicked
    function stateClick(d, i, hasQuote) {

        $("#places").empty();
        hideTiles();

        var x, y, zoom;

        if (d && self.centered !== d && hasQuote) {

            changeProjection(self.mercator);
            var centroid = path(self.mercator).centroid(d),
                w = d.properties.zWidth,
                h = d.properties.zHeight;

            x = centroid[0];
            y = centroid[1];
            zoom = self.zoom;
            self.centered = d;
            self.state = d.id;

            var perW = w/self.width,
                perH = h/self.height,
                diff = Math.max(perW, perH);

            if(diff > 1) {
                zoom = zoom/diff;
            }
            else {
                diff = 1 - diff;
                diff = parseFloat(1. + diff);
                zoom = zoom*diff;
            }


        }
        else {

            changeProjection(self.albers);
            x = self.mapX;
            y = self.mapY;
            zoom = 1;
            self.centered = null;
            self.state = null;
        }

        self.mapGroup.selectAll("path")
            .classed("active", self.centered && function (d) {
                return d === self.centered;
            });

        self.mapGroup.transition()
            .duration(750)
            .attr("transform", "translate(" + self.mapX + "," + self.mapY + ")scale(" + zoom + ")translate(" + -x + "," + -y + ")")
            .style("stroke-width", 1.5 / zoom + "px")
            .attr("class", function () {
                return (self.centered && self.state) ? "centered" : "";
            })
            .each("end", function () {
                if (self.centered && self.state) {
                    drawCities();
                    loadTiles(zoom, x, y);
                    showTiles();
                }
            });

    }


    //Make map tiles visible
    function showTiles() {
        self.tiles.transition()
            .duration(250)
            .attr("opacity", 1.0);
    }

    //Hide map tiles
    function hideTiles() {
        self.tiles.attr("opacity", 0);
    }


    //Get apppriate tiles from mapbox and insert them into tiles layer
    function loadTiles(zoom, x, y) {

        var scale = self.mercator.scale(),
            long = self.mercator.center()[0],
            lat = self.mercator.center()[1];

        var projection = d3.geo.mercator()
            .scale(scale)
            .translate([self.mapX, self.mapY]);

        var center = projection([long, lat]),
            x1 = center[0],
            y1 = center[1];

        var x2 = self.mapX - x,
            y2 = self.mapY - y;

        x2 = x1 - x2;
        y2 = y1 - y2;

        center = projection.invert([x2, y2]);
        long = center[0];
        lat = center[1];

        scale = scale*zoom;

        projection = d3.geo.mercator()
            .scale(scale)
            .translate([self.mapX, self.mapY]);

        center = projection([long, lat]);
        x = center[0];
        y = center[1];

        var zScale = (scale * 2 * Math.PI);

        var zTranslate = [(self.width - x), (self.height - y)];

        var tiles = self.tile
            .scale(zScale)
            .translate(zTranslate)();

        var image = self.tiles
            .attr("transform", "scale(" + tiles.scale + ")translate(" + tiles.translate + ")")
            .selectAll("image")
            .data(tiles, function(d) {
                return d;
            });

        image.exit()
            .remove();

        image.enter().append("image")
            .attr("xlink:href", function(d) {
                return "http://" + ["a", "b", "c", "d"][Math.random() * 4 | 0]
                    + ".tiles.mapbox.com/v3/x2gboye.jhe1npi6/"
                    + d[2] + "/" + d[0] + "/" + d[1]
                    + ".png?access_token=pk.eyJ1IjoieDJnYm95ZSIsImEiOiI1WXMtdDZVIn0.QUv1GWRAPHytz96Pdac4nw";
            })
            .attr("width", 1)
            .attr("height", 1)
            .attr("x", function(d) { return d[0]; })
            .attr("y", function(d) { return d[1]; });


    }


    //for the selected state, find places in the map json that have quotes
    //in the csv and draw circles indication their location.
    //circle diameters are percentage of total quotes in state based.
    function drawCities() {

        var data = self.pData,
            qStates = self.parent.nestData("Prospect State", self.data);

        //array will store data for city points
        var cities = [];

        //get city data from topojson by selected state
        var pCities = data.filter(function (d) {
            return (d.properties.stateid === self.state);
        });
        //sort alphabetically
        pCities = pCities.sort(function (a, b) {
            if (a.properties.name < b.properties.name) return -1;
            if (a.properties.name > b.properties.name) return 1;
            return 0;
        });

        //nest quote data by State and City and rollup
        var qCities = d3.nest()
            .key(function (d) {
                return d["Prospect State"];
            })
            .key(function (d) {
                return d["Prospect City"];
            })
            .sortKeys(d3.ascending)
            .rollup(function (leaves) {
                return {
                    "Number of Quotes": leaves.length,
                    "Number of Quotes Sold": d3.sum(leaves, function (d) {
                        return d["Number of Quotes Sold"];
                    }),
                    "Total Premium Quoted": d3.sum(leaves, function (d) {
                        return d["Total Premium Quoted"];
                    }),
                    "Total Premium Sold": d3.sum(leaves, function (d) {
                        return d["Total Premium Sold"];
                    })
                }
            })
            .entries(self.data);

        //filter quote data by selected state
        qCities = qCities.filter(function (d) {
            return (d.key === self.centered.properties.state);
        });
        //drill down to cities in selected state
        qCities = qCities[0].values;


        //build cities array w/ cities that have quotes
        //add values (quote data) object to each city
        for (i = 0; i < qCities.length; i++) {
            var key = qCities[i].key;

            for (j = 0; j < pCities.length; j++) {
                var city = pCities[j].properties.name;
                if (city === key) {
                    pCities[j].values = {};
                    for (k = 0; k < d3.keys(qCities[i].values).length; k++) {
                        var key = d3.keys(qCities[i].values)[k],
                            value = qCities[i].values[key];
                        pCities[j].values[key] = value;
                    }
                    cities.push(pCities[j]);
                }
            }
        }

        //get the total number of quotes in selected state
        var qTotal = qStates.filter(function (d) {
            return (d.key === self.centered.properties.state);
        });
        qTotal = qTotal[0].values["Number of Quotes"];

        cities = cities.sort(function (a, b) {
            return b.values["Number of Quotes"] - a.values["Number of Quotes"];
        });

        self.places
            .selectAll(".place")
            .data(cities)
            .enter().append("circle")
            .each(function (d, i) {
                var radius,
                    quotes = d.values["Number of Quotes"],
                    percent = Math.ceil(quotes / qTotal * 100);
                radius = (percent > 10) ? 10 : percent;

                d3.select(this)
                    .attr({
                        class: "place",
                        r: 0,
                        fill: color()[0],
                        transform: function(d) { return "translate(" + self.mercator(d.geometry.coordinates) + ")"; }
                    })
                    .on("mousemove", function (d, i) {
                        selectArea(d.properties.name, d.values, this);
                    })
                    .transition()
                    .duration(250)
                    .attr("r", radius);
            });

    }

    //show tip on state or city hover
    function selectArea(key, values, node) {
        var node = $(node),
            css = node.attr("class");
        if (css.indexOf("active") > -1) {
            self.parent.hideTip();
        }
        else {
            self.parent.showTip(self.parent.mouse.x, self.parent.mouse.y, key, values);
        }
    }

    //hide tip
    function deselectArea() {
        self.parent.hideTip();
    }

}