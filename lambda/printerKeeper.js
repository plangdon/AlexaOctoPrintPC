'use strict';
var AlexaSkill = require('./AlexaSkill'),
    eventHandlers = require('./eventHandlers'),
    intentHandlers = require('./intentHandlers');

var APP_ID = undefined; //replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]"; 
var skillContext = {};

var Printerkeeper = function () {
    AlexaSkill.call(this, APP_ID);
    skillContext.needMoreHelp = true;
};

// Extend AlexaSkill
Printerkeeper.prototype = Object.create(AlexaSkill.prototype);
Printerkeeper.prototype.constructor = Printerkeeper;

eventHandlers.register(Printerkeeper.prototype.eventHandlers, skillContext);
intentHandlers.register(Printerkeeper.prototype.intentHandlers, skillContext);

module.exports = Printerkeeper;

