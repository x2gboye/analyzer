var ANLZ = ANLZ || {};


ANLZ.map = {

    draw: function() {

        var color = ANLZ.settings.mapColors(),
            tip = ANLZ.tip,
            util = ANLZ.util,
            width = $('#usmap').width(),
            height = $('#usmap').height(),
            scale = Math.max(width, height),
            zoom = 6,
            centered,
            state;

        var projection = d3.geo.albersUsa()
            .scale(scale)
            .translate([width / 2, height / 2])
            .precision(.1);

        var path = d3.geo.path()
            .projection(projection)
            .pointRadius(2);

        var svg = d3.select("#usmap .chart").append("svg")
            .attr("width", width)
            .attr("height", height);

        d3.json(ANLZ.settings.mapJSON, function (error, us) {

            var states = topojson.feature(us, us.objects.states).features,
                places = topojson.feature(us, us.objects.places).features,
                qLen = ANLZ.init.data.length,
                qStates = ANLZ.chart.nest("Prospect State", ANLZ.init.data),
                arr = [];

            states = states.sort(function (a, b) {
                if (a.properties.state < b.properties.state) return -1;
                if (a.properties.state > b.properties.state) return 1;
                return 0;
            });

            $.each(states, function (i, v) {
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


            svg.append("rect")
                .attr("class", "background")
                .attr("width", width)
                .attr("height", height)
                .on("click", stateClick);

            var g = svg.append("g").attr("id", "mapGroup");

            g.append("g")
                .attr("id", "states")
                .selectAll("path")
                .data(states)
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
                        c = color[arr.indexOf(percent)];
                    }
                    else {
                        c = "#dcdcdc";
                    }

                    d3.select(this)
                        .attr({
                            d: path,
                            class: function () {
                                var quoted = (p.length) ? "quoted" : "";
                                return "state " + quoted;
                            },
                            fill: c,
                            stroke: color[1],
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

            d3.select("#states")
                .selectAll("path")
                .each(function (d, i) {
                    var that = d3.select(this),
                        node = that.node();

                    d.properties["zWidth"] = Math.ceil(node.getBoundingClientRect().width * zoom);
                    d.properties["zHeight"] = Math.ceil(node.getBoundingClientRect().height * zoom);

                });


            var cities = g.append("g").attr("id", "places");


            function stateClick(d, i, hasQuote) {

                $("#places").empty();

                var x, y, k;

                if (d && centered !== d && hasQuote) {

                    var centroid = path.centroid(d),
                        w = d.properties.zWidth,
                        h = d.properties.zHeight;

                    x = centroid[0];
                    y = centroid[1];
                    k = zoom;
                    centered = d;
                    state = d.id;

                    if (w > width || h > height) {
                        if (w <= width * 1.5 && h <= height * 1.5) {
                            k = 4;
                        }
                        else {
                            k = 3;
                        }
                    }


                } else {
                    x = width / 2;
                    y = height / 2;
                    k = 1;
                    centered = null;
                    state = null;
                }

                g.selectAll("path")
                    .classed("active", centered && function (d) {
                        return d === centered;
                    });

                g.transition()
                    .duration(750)
                    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
                    .style("stroke-width", 1.5 / k + "px")
                    .attr("class", function () {
                        return (centered && state) ? "centered" : "";
                    })
                    .each("end", function () {
                        if (centered && state) {
                            drawCities();
                        }
                    });
            }


            //draw the city points
            function drawCities() {

                //array will store data for city points
                var cities = [];

                //get city data from topojson by selected state
                var pCities = places.filter(function (d) {
                    return (d.properties.stateid === state);
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
                    .entries(ANLZ.init.data);

                //filter quote data by selected state
                qCities = qCities.filter(function (d) {
                    return (d.key === centered.properties.state);
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
                    return (d.key === centered.properties.state);
                });
                qTotal = qTotal[0].values["Number of Quotes"];

                cities = cities.sort(function (a, b) {
                    return b.values["Number of Quotes"] - a.values["Number of Quotes"];
                });

                d3.select("#places")
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
                                fill: color[0],
                                transform: function (d) {
                                    return "translate(" + projection(d.geometry.coordinates) + ")";
                                }
                            })
                            .on("mousemove", function (d, i) {
                                selectArea(d.properties.name, d.values, this);
                            })
                            .transition()
                            .duration(250)
                            .attr("r", radius);
                    });

            }


            function selectArea(key, values, node) {
                var node = $(node),
                    css = node.attr("class");
                if (css.indexOf("active") > -1) {
                    tip.hide();
                }
                else {
                    tip.show(util.mouse.x, util.mouse.y, key, values);
                }
            }

            function deselectArea() {
                tip.hide();
            }


            ANLZ.util.loaded();

        });

    }

}
