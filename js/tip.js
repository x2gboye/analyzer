var ANLZ = ANLZ || {};

ANLZ.tip = {

    init: function () {
        var chartTip = '<div class="chart-tip" id="chartTip"><table>';
            chartTip += '<thead><tr><th class="key" colspan="2"></th></tr></thead>';
            chartTip += '<tbody></tbody>';
            chartTip += '</table></div>';

        $("body").prepend(chartTip);
    },

    //update tip position, data
    show: function (left, top, key, values) {

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
    },


    //hide the tip
    hide: function () {
        var tip = $("#chartTip");
        tip.hide();
    }

};