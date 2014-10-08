var mappings = {

    quotes: [{
            value: "Number of Quotes",
            rollup: true,
            select: "count",
            count: true
        },
        {
            value: "Number of Quotes Sold",
            select: "count",
            rollup: true
        },
        {
            value: "Total Premium Quoted",
            type: "money",
            select: "amount",
            rollup: true
        },
        {
            value: "Total Premium Sold",
            type: "money",
            select: "amount",
            rollup: true
        },
        {
            value: "Quote Year Created",
            type: "date",
            format: "year",
            key: "Quote Date Created",
            timeline: true,
            ignore: true
        },
        {
            value: "Quote Year and Month Created",
            type: "date",
            format: "yearMonth",
            key: "Quote Date Created",
            timeline: true,
            selected: true,
            ignore: true
        },
        {
            value: "Quote Date Created",
            type: "date",
            timeline: true
        },
        {
            value: "Sale Written Year",
            type: "date",
            format: "year",
            key: "Sale Written Date Created",
            timeline: true,
            ignore: true
        },
        {
            value: "Sale Written Year and Month",
            type: "date",
            format: "yearMonth",
            key: "Sale Written Date Created",
            timeline: true,
            ignore: true
        },
        {
            value: "Sale Written Date Created",
            type: "date",
            timeline: true
        },
        {
            value: "Sale Written Week Of Year",
            type: "string",
            format: "leadingZero",
            timeline: true
        },
        {
            value: "Sale Written Day Of Month",
            type: "string",
            format: "leadingZero",
            timeline: true
        },
        {
            value: "Prospect Zip",
            variable: true
        },
        {
            value: "Prospect State",
            variable: true,
            map: true,
            mapLevel: "state"
        },
        {
            value: "Sales Person",
            organization: true,
            selected: true
        },
        {
            value: "Billing Mode",
            variable: true,
            selected: true
        },
        {
            value: "Line Of Business",
            variable: true
        },
        {
            value: "Product",
            variable: true
        },
        {
            value: "Prospect City",
            variable: true,
            type: "string",
            format: "titleCase",
            map: true,
            mapLevel: "city"
        },
        {
            value: "Most Recent Contact Source Type Prior To Quote",
            variable: true
        },
        {
            value: "Made Sale",
            variable: true
        },
        {
            value: "Most Recent Contact Source Prior To Quote",
            variable: true
        },
        {
            value: "Quote Comment"
        }]
};