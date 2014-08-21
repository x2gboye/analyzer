var ANLZ = ANLZ || {};
ANLZ.chart = ANLZ.chart || {};

ANLZ.chart.select = function (btn, myData) {

    var widget = btn.parents('.widget'),
        chart = widget.attr('id'),
        key = widget.data('key'),
        chartType = btn.data('viz'),
        limit = (chart === "timeline") ? 120 : 30;

    var val = d3.nest()
        .key(function (d) {
            return d[key];
        })
        .sortKeys(d3.ascending)
        .rollup(function(leaves) {
            return {
                "Number of Quotes": leaves.length,
                "Number of Quotes Sold": d3.sum(leaves, function(d) {
                    return d["Number of Quotes Sold"];
                }),
                "Total Premium Quoted": d3.sum(leaves, function(d) {
                    return d["Total Premium Quoted"];
                }),
                "Total Premium Sold": d3.sum(leaves, function(d) {
                    return d["Total Premium Sold"];
                })
            }
        })
        .entries(myData);

    btn.siblings().removeAttr("disabled");
    widget.find('.total-select button').removeAttr("disabled");


    if (val.length > limit) {
        widget.find('.chart-select :not([data-viz="grid"])').attr("disabled", "disabled");
        if (chartType != "grid") {
            btn.siblings('[data-viz="grid"]').trigger("click");
            return;
        }
    }
    else if (val.length < 2) {
        widget.find('.chart-select :not([data-viz="grid"])').attr("disabled", "disabled");
        if (chartType != "grid") {
            widget.find('.chart-select [data-viz="grid"]').trigger("click");
            return;
        }
    }
    else {
        var savedChart = $.cookie(chart);
        if(chartType != savedChart) {
            btn.siblings('[data-viz="' + savedChart + '"]').trigger("click");
            return;
        }
    }

    if (chartType === "grid") {
        widget.find('.total-select button').attr('disabled', 'disabled');
    }

    this.clear(chart);

    /*if(val.length == 1 && chartType != "grid") {
        this.single(key, val, '#' + chart); //chart.single.js
        return
    }*/

    switch (chartType) {
        case "pie":
            this.pie(key, val, '#' + chart); //chart.pie.js
            break;
        case "line":
            this.line(key, val, '#' + chart); //chart.line.js
            break;
        case "grid":
            this.grid(key, val, '#' + chart); //chart.grid.js
            if(val.length == 1) {
                this.single(key, val, '#' + chart);
            }
            break;
        default:
            this.bar(key, val, '#' + chart); //chart.bar.js
    }

    //console.log("fired on " + chart);
};


ANLZ.chart.clear = function (chart) {
    $('#' + chart).find('.chart').empty();
};
