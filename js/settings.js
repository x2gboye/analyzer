var ANLZ = ANLZ || {};

ANLZ.settings = {

    dataFile: "data/Quotes.csv?v=0.7",

    mapJSON: "data/us.json?v=0.7",

    detailView: "detail.html?v=0.7",

    fields: [
        "Billing Mode",
        "Line Of Business",
        "Made Sale",
        "Most Recent Contact Source Prior To Quote",
        "Most Recent Contact Source Type Prior To Quote",
        "Product",
        "Prospect State",
        "Prospect City",
        "Prospect Zip"
    ],

    range: [
        "Quote Year Created",
        "Quote Year and Month Created",
        "Quote Date Created"/**/,
        "Sale Written Year",
        "Sale Written Year and Month",
        "Sale Written Date Created",
        "Sale Written Week Of Year",
        "Sale Written Day Of Month"
    ],

    detailIgnore: [
        "Quote Year Created",
        "Quote Year and Month Created",
        "Sale Written Year",
        "Sale Written Year and Month"
    ],

    margin: {
        top: 20,
        right: 20,
        bottom: 30,
        left: 70
    },

    color: function () {

        var color = [];

        for (i = 0; i < 3; i++) {
            color = color.concat(colorbrewer.Paired[12]);
        }

        return color;

    },

    colorPrem: function (isPrem) {

        var color = this.color();

        return (isPrem) ? [color[2], color[3]] : [color[0], color[1]];

    },

    mapColors: function() {
        var colors = [];
        colors = colors.concat(colorbrewer.Blues[6]);
        colors.reverse();

        return colors;
    }

};
