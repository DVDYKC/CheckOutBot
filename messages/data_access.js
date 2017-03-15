//Top level object
var dataAccess = {};

/*
MongoDB
*/
var mongoClient = require('mongodb').MongoClient;
var connectionUrl = 'mongodb://checkoutbot:checkoutbot@ds058579.mlab.com:58579/checkoutbot';
var db;

//Called before server start in index to establish reusable connection
function connectToDb(callback)
{
    mongoClient.connect(connectionUrl, function(err,database){
        if(!err)
        {
            console.log('Successfully connected to database');
            db = database;
            callback();
        }
        else
        {
            console.error('Error connecting to database');
        }
    });
}


/*
Checkin functions
*/
function findReservation(name, number, callback)
{
    
    db.collection('reservation').findOne({"roomNumber": number, "roomBookingName": name}, function(err, doc){
        if(!err)
        {
            if(doc)
            {
                console.dir(doc);
            }
            else
            {
                console.dir('Reservation not found');
            }
        }
        else
        {
            console.error();
        }
        callback(err, doc);
    });
}

/*
Checkout functions
*/
//Find room
function findRoom(roomNumber, confirmationNumber, callback)
{
    db.collection('rooms').findOne({"roomNumber": roomNumber, "confirmationNumber": confirmationNumber}, function(err, doc){
        if(!err)
        {
            if(doc)
            {
                console.dir(doc);
            }
            else
            {
                console.dir('Room not found');
            }
        }
        else
        {
            console.error();
        }

        callback(err, doc);
    });
};

//Update email
function updateEmail(roomNumber, newEmail, callback)
{
    db.collection('rooms').updateOne(
        {"roomNumber": roomNumber},
        {
            $set: {"email": newEmail}
        }, 
        function (err, results)
        {
            if(!err)
            {
                console.log(results);
                callback(null);
            }
            else
            {
                console.log(err);
                callback(err);
            }
        }
    )
}

dataAccess.connectToDb = connectToDb;
dataAccess.findReservation = findReservation;
dataAccess.findRoom = findRoom;
dataAccess.updateEmail = updateEmail;
module.exports = dataAccess;