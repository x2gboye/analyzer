var ANLZ = ANLZ || {};

ANLZ.init = {

    data: [],

    mapData: function (rows) {

        this.data = d3.entries(rows);

        this.data = this.data.map(function (d, i) {

            var format = d3.time.format("%m/%d/%Y"),
                qDate = format.parse(d.value["Quote Date Created"]),
                sDate = format.parse(d.value["Sale Written Date Created"]);

            function addLeadingZero(num) {
                return (parseInt(num) < 10) ? "0" + num : num;
            }

            function formatDate(date) {
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

            function toTitleCase(s) {
                return s.toLowerCase().replace(/^(.)|\s(.)/g,
                    function ($1) {
                        return $1.toUpperCase();
                    });
            }

            return {
                "Number of Quotes Sold": d.value["Number of Quotes Sold"],
                "Total Premium Quoted": parseFloat(d.value["Total Premium Quoted"]),
                "Total Premium Sold": parseFloat(d.value["Total Premium Sold"]),
                "Quote Year Created": formatDate(qDate).substr(0, 4),
                "Quote Year and Month Created": formatDate(qDate).substr(0, 7),
                "Quote Date Created": formatDate(qDate),
                "Sale Written Year": formatDate(sDate).substr(0, 4),
                "Sale Written Year and Month": formatDate(sDate).substr(0, 7),
                "Sale Written Date Created": formatDate(sDate),
                "Sale Written Week Of Year": addLeadingZero(d.value["Sale Written Week Of Year"]),
                "Sale Written Day Of Month": addLeadingZero(d.value["Sale Written Day Of Month"]),
                "Prospect Zip": d.value["Prospect Zip"],
                "Prospect State": d.value["Prospect State"],
                "Sales Person": d.value["Sales Person"],
                "Billing Mode": d.value["Billing Mode"],
                "Line Of Business": d.value["Line Of Business"],
                "Product": d.value["Product"],
                "Prospect City": toTitleCase(d.value["Prospect City"]),
                "Most Recent Contact Source Type Prior To Quote": d.value["Most Recent Contact Source Type Prior To Quote"],
                "Made Sale": d.value["Made Sale"],
                "Most Recent Contact Source Prior To Quote": d.value["Most Recent Contact Source Prior To Quote"],
                "Quote Comment": d.value["Quote Comment"]
            };

        });

    },

    dropdowns: function () {

        //Field select dropdown
        d3.selectAll(".field-select, .range-select")
            .selectAll("li")
            .data(function () {
                var fields;
                var select = $(d3.select(this).node().parentNode);
                if (select.hasClass("field-select")) {
                    fields = ANLZ.settings.fields;
                }
                else if (select.hasClass("range-select")) {
                    fields = ANLZ.settings.range;
                }
                return fields;
            })
            .enter().append("li")
            .append("a")
            .attr("href", "#")
            .attr("data-key", function (d) {
                return d;
            })
            .text(function (d) {
                return d;
            })
            .on('click', function (d) {
                d3.event.preventDefault();
                var node = d3.select(this).node(),
                    widget = $(node).parents('.widget'),
                    btn = widget.find('.chart-select .btn.active');
                widget.data("key", d);
                widget.find(".dropdown-toggle span.text").text(d);
                $(node).parent().siblings().removeClass('active');
                $(node).parent().addClass('active');
                ANLZ.chart.select(btn, ANLZ.filter.data());
            });

        $('.widget').each(function () {
            var key = $(this).data("key");
            $(this).find('.dropdown-toggle span.text').text(key);
            $(this).find('.dropdown-menu li a[data-key="' + key + '"]').parent().addClass("active");
        });

    },

    filters: function () {

        //Init filter table
        var filters = d3.select("#filters table tbody")
            .selectAll("tr")
            .data(d3.keys(this.data[0]))
            .enter().append("tr")
            .attr("class", "hide");
        filters.append("td")
            .text(function (d) {
                return d;
            });
        filters.append("td")
            .attr("class", "value")
            .text("");
        filters.append("td")
            .attr("class", "action")
            .append("button")
            .attr("class", "btn btn-default btn-xs remove")
            .append("i")
            .attr("class", "glyphicon glyphicon-remove");

    },

    buttons: function () {

        var self = this;

        //Chart type buttons
        $('.chart-select .btn')
            .click(function () {
                var btn = $(this);
                if (!btn.hasClass('active')) {
                    ANLZ.chart.select(btn, ANLZ.filter.data());
                }
                btn.siblings().removeClass("active");
                btn.addClass("active");
            })
            .mouseup(function () {
                var btn = $(this);
                ANLZ.filter.saveChart(btn);
            })
            .each(function () {
                var btn = $(this);
                if (btn.hasClass('active')) {
                    ANLZ.filter.saveChart(btn);
                }
            });

        //Total type buttons
        $('.total-select .btn')
            .click(function () {
                var $this = $(this),
                    btn = $this.parent().siblings(".chart-select").find("button.active");

                if (!$this.hasClass('active')) {
                    $this.siblings().removeClass("active");
                    $this.addClass("active");
                    ANLZ.chart.select(btn, ANLZ.filter.data());
                }
            });

        //save chart button
        $('#saveSearch').on("click", function () {
            ANLZ.search.save();
        });

        //self.clickActiveBtns();

    },

    clickActiveBtns: function() {

        $('.chart-select .btn')
            .each(function () {
                var btn = $(this);
                if (btn.hasClass('active')) {
                    ANLZ.chart.select(btn, ANLZ.filter.data());
                }
            });

    },

    tabs: function () {

        $('nav a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            var iframe = $("#detail").find("iframe");
            iframe.attr("src", "");
            var id = $(e.target).attr("href");
            if (id === "#detail") {
                $('.loading > div').html(function () {
                    var count = parseInt($('#rowCount').text()),
                        warning = ANLZ.filter.rowCountWarning(count),
                        span = '<span class="badge" style="background: ' + warning.color + '">';
                    span += count + '</span>';
                    return "Loading " + span + " rows.<br />" + warning.message;
                });
                $('.loading').show();
                setTimeout(function () {
                    iframe.attr("src", "detail.html?v=0.4");
                }, 250);
            }
        });

    },

    events: function () {

        var id;

        $(window).on("resize", function () {
            clearTimeout(id);
            var widgets = [];
            $('.widget').each(function () {
                var id = $(this).attr("id");
                widgets.push(id);
            });
            id = setTimeout(function() {
                ANLZ.util.onResize(widgets)
            }, 250);
        }).trigger("resize");

        document.addEventListener('mousemove', function (e) {
            ANLZ.util.mouse.x = e.clientX || e.pageX;
            ANLZ.util.mouse.y = e.clientY || e.pageY
        }, false);

        //allow jquery objects to fire d3 click event
        jQuery.fn.d3Click = function () {
            this.each(function (i, e) {
                var evt = document.createEvent("MouseEvents");
                evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                e.dispatchEvent(evt);
            });
        };

    }

};


