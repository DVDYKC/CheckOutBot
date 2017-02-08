
/*-----------------------------------------------------------------------------
This template demonstrates how to use an IntentDialog with a LuisRecognizer to add 
natural language support to a bot. 
For a complete walkthrough of creating this type of bot see the article at
http://docs.botframework.com/builder/node/guides/understanding-natural-language/
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var StringBuilder = require('stringbuilder');

//var useEmulator = (process.env.NODE_ENV == 'development');
var useEmulator =true;
var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);

bot.dialog('/', [
    function (session){
    session.userData.tried =0;
    session.beginDialog('/Checkout');
    }
]);

bot.dialog('/Checkout',[
    function(session){
        switch(session.userData.tried){
            case 0:                
                return session.beginDialog('/RoomName');
            case 1:
            case 2:
                return session.beginDialog('/RoomNameorBook');
            case 3:
                session.send('Sorry I cant find your record in our system. Please note that you are only allowed 4 express check out attempt. Kindly provide whose the name your room is booked under? Or your booking confirmatin number?');
                return session.beginDialog('/RoomNameorBook');
            case 4:
                session.send('Sorry I cant find your record in our system please proceed to checkout at the front desk');
                return session.endDialog();
        }
    },
    function(session,result){
        session.beginDialog('/RoomNoValidation'); 
    },
    function(session,result){
        if(session.userData.RoomNo == ''){
            return session.endDialog();
        }
        if(session.userData.tried < 4){
            session.send('Please wait while I am processing your checkout');
            var result = ValidateMe(session.userData.RoomNo,session.userData.Name)
            if(result == 'A' || result == 'B'){
                if(result == 'A'){
                    session.beginDialog('/ConfirmCheckout');
                }
                if(result == 'B'){
                    session.beginDialog('/CheckoutDoneCounter');
                }
                // session.endDialog();
            }else{
                session.userData.tried = session.userData.tried + 1;
                session.beginDialog('/Checkout');
            }
        } else {
            session.send('Sorry I cant find your record in our system please proceed to checkout at the front desk');
            session.endDialog();
        }
    }
]);

function ValidateMe(RoomNo,RoomName){
    switch(RoomNo + "||" + RoomName){
        case '8888-1||David':
            return 'A';
        case '9999-1||Aimee':
            return 'B';
        case 'ABCDE||David':
            return 'A';
        default:
            return 'C';
    }
}

bot.dialog('/RoomName',[
    function(session){
        builder.Prompts.text(session,'May I know whose the name your room is booked under?');
    },
    function(session,results){
        session.userData.Name = results.response;
        session.endDialog();
    }
]);

bot.dialog('/RoomNameorBook',[
    function(session){
        builder.Prompts.text(session,'Sorry I cant find your record in our system please provide whose the name your room is booked under? Or your booking confirmatin number?');
    },
    function(session,results){
        session.userData.Name = results.response;
        session.endDialog();
    }
]);

bot.dialog('/RoomNoValidation', [
    function (session) {
        session.userData.RoomNo = "";
        builder.Prompts.text(session, 'Can you please provide your room number and tower? For example 1221-2');
    },
    function (session, results) {        
        // Validate Mask
        session.userData.RoomNo ="Empty";
        session.userData.RoomNo = results.response;
        var DataInput = session.userData.RoomNo;
        var RoomNo = DataInput.substring(0,4);
        var Dash = DataInput.substring(4,5);
        var Tower = DataInput.substring(5,6);
        
        if(!isNaN(RoomNo) && !isNaN(Tower)){
            console.log('checkNo---------------------------');
            console.log(RoomNo);
            console.log(Tower);
            session.userData.RoomNo = results.response;
            session.endDialog();
        }else
        {
            console.log('checkNo***************************');
            builder.Prompts.text(session, 'Please enter room number in this format ROOM NUMBER-TOWER NUMBER');
        }       
    },
    function (session, results) {        
        session.userData.RoomNo = results.response;
        // Validate Mask
        var DataInput = session.userData.RoomNo;
        var RoomNo = DataInput.substring(0,4);
        var Dash = DataInput.substring(4,5);
        var Tower = DataInput.substring(5,6);
        
        if(!isNaN(RoomNo) && !isNaN(Tower)){
            session.userData.RoomNo = results.response;
            session.endDialog();
        }
        else {
            session.userData.RoomNo = '';
            session.send('Your room number looks wrong. Please proceed to the checkout counter to checkout');
            session.endDialog();
        }       
    },
]);

bot.dialog('/ConfirmCheckout', [
    function (session) {
        // heroCard
        builder.Prompts.confirm(session,'This is your final bill, if you have any clarification on the outstanding amount, please reply No and proceed to the front desk for check out, else please reply YES CHECKOUT',
        {listStyle: builder.ListStyle.button});
    },
    function (session, results) {
        if (results.response) {
            session.beginDialog('/SentBellboy');
        } else {
            session.send('Sorry you would need to check out from our front desk to get your final bill');
        }
    },
]);

bot.dialog('/SentBellboy',[
    function (session) {
        builder.Prompts.confirm(
            session,
            'Do you wish me to send a bell boy over to help on your luggage. Please answer yes or no',
            {
                listStyle: builder.ListStyle.button
            });
    },
    function (session, results) {
        if (results.response) {
            session.send('I’ll send the bellboy over');
            return session.endDialog();
        } else {
            session.send('Okay. Thank you.');
            return session.endDialog();
        }
    }
]);

bot.dialog('/CheckoutDoneCounter',[
    function(session){
        session.send('Sorry you would need to check out from our front desk to get your final bill');
        session.endDialog();
    }
]);

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}

