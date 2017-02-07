/*-----------------------------------------------------------------------------
This template demonstrates how to use an IntentDialog with a LuisRecognizer to add 
natural language support to a bot. 
For a complete walkthrough of creating this type of bot see the article at
http://docs.botframework.com/builder/node/guides/understanding-natural-language/
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);

// Make sure you add code to validate these fields
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'api.projectoxford.ai';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] })
/*
.matches('<yourIntent>')... See details at http://docs.botframework.com/builder/node/guides/understanding-natural-language/
*/
.matches('Checkouttime',[
    function (session, args, next) {
        session.send('The check out time is 11 am');
    }    
])
.matches('Thanks',[
    function (session, args, next) {
        session.send('You’re welcome.');
    }    
])
.matches('StartConvo',[
    function (session, args, next) {
        session.send('How may I help you?');
    }    
])
.matches('AirportCab',[
    function (session) {
        builder.Prompts.confirm(
            session,
            'Do you want me to call a cab to the airport',
            {
                listStyle: builder.ListStyle.button
            });
    },
    function (session, results) {
        if (results.response) {
            session.send('Please proceed to the lobby. Our bell boy will call a cab for you.');
            return session.endDialog();
        } else {
            //return session.beginDialog('withoutroomreservations');
        }
    }   
])
.matches('checkout',[
    function (session) {
        builder.Prompts.confirm(
            session,
            'Do you also wish to do express check out now?',
            {
                listStyle: builder.ListStyle.button
            });
    },
    function (session, results) {
        if (results.response) {
            session.send('Please proceed to the lobby. Our bell boy will call a cab for you.');
            return session.endDialog();
        } else {
            //return session.beginDialog('withoutroomreservations');
        }
    }   
])
.matches('None', (session, args) => {
    session.send('Hi! This is the None intent handler. You said: \'%s\'.', session.message.text);
})
.onDefault((session) => {
    session.send('Sorry, I did not understand \'%s\'.', session.message.text);
});

bot.dialog('/', intents);    
bot.dialog('/Checkout',[
    function (session) {
        builder.Prompts.text(session,'May I know whose the name your room is booked under?');
    },
    function (session, results) { 
        session.userData.Name = results.response;
        session.userData.tried = 0;
        beginDialog('RoomNoValidation');
        if(session.userData.RoomNo == '')
        {
            session.endDialog();
        }
    },
    function(session,results){
        session.send('Please wait while I am processing your checkout');
        if(session.userData.RoomNo == '8888' && session.userData.Name == 'David'){
            beginDialog('CheckoutDone');
            session.endDialog();
        }
        if(session.userData.RoomNo == '8888' || session.userData.Name == 'David'){

        }

    }
])

bot.dialog('/RoomNoValidation', [
    function (session) {
        session.userData.RoomNo = "";
        builder.Prompts.text(session, 'Can you please provide your room number and tower? For example 1221-2');
    },
    function (session, results) {        
        // Validate Mask
        var DataInput = session.userData.RoomNo;
        var RoomNo = DataInput.substring(0,4);
        var Dash = DataInput.substring(4,5);
        var Tower = DataInput.substring(5,6);
        
        if(!isNaN(RoomNo) && !isNaN(Tower)){
            session.userData.RoomNo = results.response;
            session.endDialog();
        }        
    },
    function(session){
        builder.Prompts.text(session, 'Please enter room number in this format ROOM NUMBER-TOWER NUMBER');
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
            builder.send('Your room number looks wrong. Please proceed to the checkout counter to checkout');
            session.endDialog();
        }       
    },
]);

bot.dialog('/CheckoutDone',[
    function(session){

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

