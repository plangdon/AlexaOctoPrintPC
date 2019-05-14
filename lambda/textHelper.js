'use strict';
var textHelper = (function () {


    return {
        appName: 'Printer Buddy',
        completeHelp: ' Here\'s some things you can say,'
        + ' list,'
        + ' status,'
        + ' start print,'
        + ' stop print,'
        + ' pause print,'
        + ' resume print '
        + ' and exit. ',
        bedCleared : ' Has the bed been cleared and you are now ready to start a new print?',
        errorConnecting : ' Having trouble connecting to your printer right now.' 
        + ' Please check its network connection and power supply.',
        sure: ' Are you sure you want to ',
        goodBye: ' Thanks for using Printer Buddy, goodbye!',
        wantMore: ' Is there anything else you would like?'
    };
})();
module.exports = textHelper;
