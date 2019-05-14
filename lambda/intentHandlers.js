'use strict';
/* Require HTTP connection for use */
const http = require('http');
const textHelper = require('./textHelper');
const httpHelper = require('./httpHelper');
const printerHelper = require('./printerHelper');
const storage = require('./storage');


function cleanName(name){
    let cleanName = name.replace(/[^\w\s]/gi, ' ');
    cleanName = cleanName.replace(/_/g, " ");
    return cleanName.replace('gcode','');
}

function printServerList(isShort){
    let printers = printerHelper.printers;
    
    let speechOutput = " You have " + printers.length + " servers available. They are " ;
        if (!isShort){
            for (let i=0;i<printers.length;i++){
                if (i==printers.length-1) {
                    speechOutput += " and ";
                } else if (i>0) {
                  speechOutput += ", ";
    
                }
                speechOutput += printers[i].name;
            }
        } else {
            speechOutput += "numbered 1 through " + printers.length;
        }
        speechOutput += ". Which server would you like to use? Say it's number to choose. "
        
    return speechOutput;
}

async function isPrintServerSelected(session,response){
    let speechOutput = '';
    
    let selectedId = await getCurrentDynamo(session);
    
    if (!session.attributes.hasOwnProperty('selected')){
        
        if (!session.attributes.hasOwnProperty('selectedId')){
            speechOutput = " You do not have a server selected yet. ";
            speechOutput += printServerList(true);
            response.askWithCard(speechOutput, ' Which server do you want?', 'Pick a server.', speechOutput);
            return false;
        } else {
            let selected = printerHelper.setSelectedPrinter((session.attributes.selectedId*1));
            
            session.attributes.selected = selected;
            return true;
        }
    } else {
        return true;
    }
}

function processStatusResponse(session){
    let speechOutput;
    let printTimeLeft,printHoursLeft,printMinLeft;

    speechOutput = ' You are connected to ' + session.selected.name + ' ';
    speechOutput += 'on port ' + session.current.port + '.';
    speechOutput += ' The printer is currently ' + session.job.state + '.';
         
        if (session.job.job.file.name !== null) {
            if (session.job.progress.completion== 100) {
                printTimeLeft = session.job.progress.printTime;
                printHoursLeft = ((printTimeLeft/60)/60);
                printMinLeft = (printHoursLeft - Math.floor(printHoursLeft))*60;
                speechOutput += ' The printing of ' + cleanName(session.job.job.file.name) + ' is complete.';
                speechOutput += ' Print time was ' + Math.floor(printHoursLeft) + ' hours ' + Math.round(printMinLeft) + ' minutes.';

            } else if (session.job.progress.completion!== null) {
                printTimeLeft = session.job.progress.printTimeLeft;
                printHoursLeft = ((printTimeLeft/60)/60);
                printMinLeft = (printHoursLeft - Math.floor(printHoursLeft))*60;
                speechOutput += ' It is printing ' + cleanName(session.job.job.file.name) + '.';
                speechOutput += ' It is ' + Math.round(session.job.progress.completion) + ' percent done.';
                speechOutput += ' It has ' + Math.floor(printHoursLeft) + ' hours ' + Math.round(printMinLeft) + ' minutes left.';
            } else {
                speechOutput += ' A print job, ' + cleanName(session.job.job.file.name) + ' is loaded but not started.';
            }
         } else {
             speechOutput += ' There are no print jobs loaded.';
         }
    return speechOutput;
}

async function getCurrentState(session){


    let header =  {
      "X-Api-Key":printerHelper.selectedPrinter.key,
      "Content-Type": "application/json"
    };
    
    const options = {
        hostname: printerHelper.selectedPrinter.hostname,
        port: printerHelper.selectedPrinter.port,
        path: '/api/connection',
        method: 'GET',
        headers: header
    };
    

      try {
        let res = await httpHelper.doGetRequest(options);
        session.attributes.isConnected = true;
        session.attributes.current = res.current;
        return res;
      } catch (err){
        return err;
      }

}

async function getCurrentJob(session){
    
    let header =  {
      "X-Api-Key":printerHelper.selectedPrinter.key,
      "Content-Type": "application/json"
    };

   const options = {
    hostname: printerHelper.selectedPrinter.hostname,
    port: printerHelper.selectedPrinter.port,
    path: '/api/job',
    method: 'GET',
    headers: header
  };
  

  try {
    console.log("get option" + JSON.stringify(options));
    let res = await httpHelper.doGetRequest(options);
    session.attributes.job = res;
    return res;
  } catch (err){
    return err;
  }
 
  
  
    
}

async function doCommandJob(command){
    
    let header =  {
      "X-Api-Key":printerHelper.selectedPrinter.key,
      "Content-Type": "application/json"
    };

   const options = {
    hostname: printerHelper.selectedPrinter.hostname,
    port: printerHelper.selectedPrinter.port,
    path: '/api/job',
    method: 'POST',
    headers: header
  };
    
    let res = await httpHelper.doPostRequest(options,command);
    return res;
}

function getCurrentDynamo(session){
    return new Promise ((resolve, reject) => {
        storage.loadServer(session, function(isConnected, serverData){
                session.attributes.selectedId = serverData.Item.selectedPrinter.N;
                resolve(session.attributes.selectedId);
        });
    });
}

function saveCurrentDynamo(selectedId){
    return new Promise ((resolve, reject) => {
        storage.putServer(selectedId.toString(), function(data) {
            resolve(data);
        });
    });
}


var registerIntentHandlers = function(intentHandlers, skillContext) {

    intentHandlers.PrintStatusIntent = async function(intent, session, response) {
        let speechOutput = '';
        
        if (isPrintServerSelected(session, response)){
            let stateRes = await getCurrentState(session);
            let jobRes = await getCurrentJob(session);
            speechOutput = processStatusResponse(session.attributes);
            response.askWithCard(speechOutput + textHelper.wantMore,"Printer Status",speechOutput);
        }
    };
    
    intentHandlers.StartPrintIntent = async function(intent, session, response) {
        let speechOutput = '';
        
        if (isPrintServerSelected(session, response)){
            let stateRes = await getCurrentState(session);
            let jobRes = await getCurrentJob(session);
            
            if (session.attributes.job.job.file.name !== null){
                if (session.attributes.job.progress.completion == 100){
                    speechOutput = ' A print named ' + cleanName(session.attributes.job.job.file.name) + ' was recently completed.' + textHelper.bedCleared;
                    session.attributes.askedToStart=true;
                    session.attributes.askedToStop=false;
                    session.attributes.askedToResume=false;
                    session.attributes.askedToPause=false;
                    response.askWithCard(speechOutput,textHelper.bedCleared,'Start Print',speechOutput);
    
                } else {
                    try {
                        let command = {"command":"start"};
                        
                        if (session.attributes.current=="Paused"){
                            command = {"command":"pause","action": "resume"};
                        }
                        
                        
                        let res = await doCommandJob(command);
                        speechOutput = 'Your print of ' + cleanName(session.attributes.job.job.file.name) + ' has started.';
                        response.askWithCard(speechOutput + textHelper.wantMore,'Print Started',speechOutput);
                    } catch(err){
                        console.log(err);
                        response.tellWithCard(textHelper.errorConnecting, "Error Connecting", JSON.stringify(err));
                    }
                }
            } else {
                response.askWithCard(' Loading a file is not supported at this time. Connect to your printer and load your file elsewhere.','No File Loaded','Load your file in OctoPrint.' +  textHelper.wantMore);
            }
        }
    }
    
    intentHandlers.StopPrintIntent = async function(intent, session, response) {
         let speechOutput = '';
        

        if (isPrintServerSelected(session, response)){
        
            let stateRes = await getCurrentState(session);
            let jobRes = await getCurrentJob(session);
        
             if (session.attributes.job.job.file.name !== null&&session.attributes.job.progress.completion!== null&&session.attributes.job.progress.completion<100){
                speechOutput = 'A print named ' + cleanName(session.attributes.job.job.file.name) + ' is printing and is ' + Math.round(session.attributes.job.progress.completion) + ' percent done. ' + textHelper.sure + ' stop amd cancel this print?';
                session.attributes.askedToStart=false;
                session.attributes.askedToStop=true;
                session.attributes.askedToResume=false;
                session.attributes.askedToPause=false;
                response.askWithCard(speechOutput,textHelper.sure + ' stop amd cancel this print?','Cancel Print',speechOutput);
    
            } else {
                response.tell('It\'s hard to stop something that isn\'t running, so let\'s just call it even. I am amazing, but I can only stop jobs that are running.');
            }
            
           //response.ask(speechOutput);
        }
    }
    
    intentHandlers.PausePrintIntent = async function(intent, session, response) {
         let speechOutput = '';
        
        if (isPrintServerSelected(session, response)){
            let stateRes = await getCurrentState(session);
            let jobRes = await getCurrentJob(session);
         
             if (session.attributes.job.job.file.name !== null&&session.attributes.job.progress.completion!== null&&session.attributes.job.progress.completion<100){
                speechOutput = 'A print named ' + cleanName(session.attributes.job.job.file.name) + ' is printing and is ' + Math.round(session.attributes.job.progress.completion) + ' percent done. Are you sure you want me to pause this print?';
                session.attributes.askedToStart=false;
                session.attributes.askedToStop=false;
                session.attributes.askedToResume=false;
                session.attributes.askedToPause=true;
                response.askWithCard(speechOutput,textHelper.sure + 'pause this print?','Pause Print',speechOutput);
    
            } else {
                response.tell('It\'s hard to pause something that isn\'t running, so let\'s just call it even.');
            }
        }
    }
    
    intentHandlers.ResumePrintIntent = async function(intent, session, response) {
         let speechOutput = '';
        
        if (isPrintServerSelected(session, response)){
            let stateRes = await getCurrentState(session);
            let jobRes = await getCurrentJob(session);
        
        
             if (session.attributes.job.job.file.name !== null&&session.attributes.job.progress.completion!== null&&session.attributes.job.progress.completion<100){
                speechOutput = 'A print named ' + cleanName(session.attributes.job.job.file.name) + ' is paused and is ' + Math.round(session.attributes.job.progress.completion) + ' percent done. Are you sure you want me to resume this print?';
                session.attributes.askedToStart=false;
                session.attributes.askedToStop=false;
                session.attributes.askedToResume=true;
                session.attributes.askedToPause=false;
                response.askWithCard(speechOutput,textHelper.sure + 'resume this print?','Resume Print',speechOutput);
    
            } else {
                response.tell('It\'s hard to pause something that isn\'t running, so let\'s just call it even.');
            }
        }        
    }
    
    intentHandlers.ListPrinterIntent = async function(intent, session, response) {
       let speechOutput = printServerList();
       response. askWithCard(speechOutput,'Which print server?','Pick a print server',speechOutput);
    }

    intentHandlers.PickPrinterIntent = async function(intent, session, response) {
        let speechOutput = '';
        
        let selectedId = ((intent.slots.printer.value*1)-1);
        
        //let printers = printerHelper.printers;
        let selected = printerHelper.setSelectedPrinter(selectedId);
        session.attributes.selected = selected;
        session.attributes.selectedId = selectedId;
        
        try {
            let stateRes = await getCurrentState(session);
            let jobRes = await getCurrentJob(session);
            let saveStateDynamo = await saveCurrentDynamo(selectedId);
            speechOutput = processStatusResponse(session.attributes);
            response.askWithCard(speechOutput + textHelper.completeHelp, textHelper.completeHelp,"Printer Status",speechOutput + textHelper.completeHelp);
        } catch (err){
            response.tellWithCard(textHelper.errorConnecting, "Error Connecting", JSON.stringify(err));
        }
       
    }

    intentHandlers['AMAZON.HelpIntent'] = function(intent, session, response) {
        var speechOutput = textHelper.completeHelp;
        if (skillContext.needMoreHelp) {
            response.ask(textHelper.completeHelp + ' So, how can I help?', 'How can I help?');
        } else {
            response.tell(textHelper.completeHelp);
        }
    };

    intentHandlers['AMAZON.CancelIntent'] = function(intent, session, response) {
        response.tell(textHelper.goodBye);
    };

    intentHandlers['AMAZON.StopIntent'] = function(intent, session, response) {
        response.tell(textHelper.goodBye);
    };

    intentHandlers['AMAZON.NoIntent'] = function(intent, session, response) {
        response.tell(textHelper.goodBye);
    }

    intentHandlers['AMAZON.YesIntent'] = async function(intent, session, response) {
        if (session.attributes.askedToStart) {
         try {
                let command = {"command":"start"};
                let res = await doCommandJob(command);
                let speechOutput = 'Your print of ' + cleanName(session.attributes.job.job.file.name) + ' has started. ';
                response.askWithCard(speechOutput + textHelper.wantMore,'Print Started',speechOutput);
            } catch(err){
                console.log(err);
                response.tellWithCard(textHelper.errorConnecting, "Error Connecting", JSON.stringify(err));
            }
        } else if (session.attributes.askedToStop) {
         try {
                let command = {"command":"cancel"};
                let res = await doCommandJob(command);
                let speechOutput = 'Your print of ' + cleanName(session.attributes.job.job.file.name) + ' has been canceled. Make sure you clear the bed before you start anything new. ';
                session.attributes.askedToStop=false;
                response.askWithCard(speechOutput + textHelper.wantMore,'Print Canceled',speechOutput);
            } catch(err){
                console.log('err' + err);
                response.tellWithCard(textHelper.errorConnecting, "Error Connecting", JSON.stringify(err));
            }
        } else if (session.attributes.askedToPause) {
         try {
                let command = {"command":"pause","action": "pause"};
                let res = await doCommandJob(command);
                let speechOutput = 'Your print of ' + cleanName(session.attributes.job.job.file.name) + ' has been paused. You can resume your print by asking me to resume. ';
                session.attributes.askedToPause=false;
                response.askWithCard(speechOutput + textHelper.wantMore,'Print Canceled',speechOutput);
            } catch(err){
                console.log('err' + err);
                response.tellWithCard(textHelper.errorConnecting, "Error Connecting", JSON.stringify(err));
            }
         } else if (session.attributes.askedToResume) {
         try {
                let command = {"command":"pause","action": "resume"};
                let res = await doCommandJob(command);
                let speechOutput = 'Your print of ' + cleanName(session.attributes.job.job.file.name) + ' has been resumed. Happy printing. ';
                session.attributes.askedToResume=false;
                response.askWithCard(speechOutput + textHelper.wantMore,'Resume Print',speechOutput);
            } catch(err){
                console.log('err' + err);
                response.tellWithCard(textHelper.errorConnecting, "Error Connecting", JSON.stringify(err));
            }
        } else {
            response.ask('I am not sure what I am supposed to be helping you with ');
        }
    };
};
exports.register = registerIntentHandlers;
