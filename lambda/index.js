
'use strict';
var PrinterKeeper = require('./printerKeeper');

exports.handler = function (event, context) {
    var printerKeeper = new PrinterKeeper();
    printerKeeper.execute(event, context);
};
