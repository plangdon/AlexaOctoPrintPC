'use strict';

const printersArr = [
    {name:'Server 1', hostname: 'your.server.com', port: 8080, key:'yourapikey'},
    {name:'Server 2', hostname: 'your.server.com', port: 8081, key:'yourapikey'},
    {name:'Server 3', hostname: 'your.server.com', port: 8082, key:'yourapikey'},
    {name:'Server 4', hostname: 'your.server.com', port: 8083, key:'yourapikey'}
];

let selectedPrinter = printersArr[0];

var printerHelper = (function () {

    return {
        headers: {
          "X-Api-Key":"yourapikey",
          "Content-Type": "application/json"
        },
        hostname: 'your.server.com',
        port: 8080,
        printers: printersArr,
        selectedPrinter: selectedPrinter,
        setSelectedPrinter: function (printerNumber) {
            printerHelper.selectedPrinter = printersArr[printerNumber];
            return printerHelper.selectedPrinter;
        }
    };
})();
module.exports = printerHelper;
