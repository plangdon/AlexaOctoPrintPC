'use strict';

const httpHelper = require('./httpHelper');
const printerHelper = require('./printerHelper');
const textHelper = require('./textHelper');
const storage = require('./storage');

var registerEventHandlers = function (eventHandlers, skillContext) {
    eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
        skillContext.needMoreHelp = false;
    };
    
    eventHandlers.onLaunch = async function (launchRequest, session, response) {
        let speechOutput;
        let reprompt = textHelper.completeHelp + ' What would you like to do?';
        
        storage.loadServer(session, function(isConnected, serverData){
            
            session.attributes.selectedId = serverData.Item.selectedPrinter.N;
            
            if (!session.attributes.selectedId !== null){
                
                let selected = printerHelper.setSelectedPrinter((session.attributes.selectedId*1));
                session.attributes.selected = selected;
                
                speechOutput = 'Welcome back to the ' +  textHelper.appName + '.';
                
                speechOutput += ' You were last connected to ' + selected.name + '.';
                
            } else {
                speechOutput = 'Welcome to the ' +  textHelper.appName + '.' + reprompt;
            }
            
            
    
            response.askWithCard(speechOutput,reprompt,textHelper.appName,reprompt);
        });

    };
};


exports.register = registerEventHandlers;
