'use strict';
var AWS = require("aws-sdk");

var storage = (function () {
    var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});


    function PrintServer(session, data) {
        if (data) {
            this.data = data;
        } else {
            this.data = {
                selectedPrinter: {}
            };
        }
        this._session = session;
    }

    PrintServer.prototype = {
        save: function (callback) {
            this._session.attributes.selected.id = this.data;
            dynamodb.putItem({
                TableName: 'SelectedPrinter',
                Item: {
                    selectedPrinter: {
                        N: this._session.selected.id
                    }
                }
            }, function (err, data) {
                if (err) {
                    console.log(err, err.stack);
                }
                if (callback) {
                    callback();
                }
            });
        }
    };

    return {

        isAssociated: function (session, callback){
            dynamodb.getItem({
                TableName: 'SelectedPrinter',
                ITEM: {
                    selectedPrinter: {
                        N: session.attributes.selected.id
                    }
                }
            }, function (err, data) {
                // work with the error
                 if ((err)||(data.Item === undefined)) {
                    if (err){
                        console.log(err);
                    }
                    callback(false);
                }
                else{ 

                // work with the data

                // collect the data
                
                callback(true);

                // callback the data to function operator
                
            }});
        },
        loadServer: function (session, callback) {
            dynamodb.getItem({
                TableName: 'SelectedPrinter',
                Key: {
                    isSelectedPrinter: {
                        S: "0"
                    }
                }
            }, function (err, data) {
                // load game from database
                if ((err)||(data.Item === undefined)) {
                    if (err){
                        console.log(err);
                    }
                    // if no game create new game
                    callback(false);
                } else {
                    //var serverData = JSON.parse(data.Item.Data);
                    //session.attributes.selectedId = data.Item.Data;
                    callback(true, data);
                }
            });
        },
        putServer: function (selectedId, callback) {
            dynamodb.putItem({
                    TableName: 'SelectedPrinter',
                    Item: {
                        "selectedPrinter": {
                            N: selectedId
                        },
                        "isSelectedPrinter": {
                            S: "0"
                        }
                    }
                }, function (err, data) {
                    if (err) {
                        console.log(err, err.stack);
                    }
                    if (callback) {
                        //console.log("data" + JSON.stringify(data));
                        callback(data);
                    }
                });
        }
    };
})();
module.exports = storage;
