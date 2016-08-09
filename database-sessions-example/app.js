// Tutorial for interfacing a Microsoft SQL/Azure SQL database along with setting session variables from 
// the recieved data.
// Libraries used - tedious , client-sessions


// An almost standard azure out-of-the-box setup
// For this example it is assumed that the user is using a Microsoft SQL/Azure SQL server as the backend
// for which case tedious works out as a perfect package to interface with the database.
// This tutorial also assumes that JQuery Ajax is used to call the APIs defined by this example
var express = require('express'),
azureMobileApps = require('azure-mobile-apps');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('client-sessions');
// Set up a standard Express app
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
// Set the config for the cookies
// 'name' is the value by which you will refer to your cookie
// In this case it will be req.session since the name is 'session'
// 'duration' is the time duration for which the given session lasts
// 'active' is the time duration within which if the session cookie is
// accessed again then the duration will be refreshed
// secret is the key which will be used by the hashing function to 
// encrypt the session cookie on the client machine
app.use(session({
    cookieName: 'session',
    secret: 'qpwoeirutyalskdjfhgmznxbcv',
    duration: 4 * 24 * 60 * 60 * 1000,
    active: 4 * 24 * 60 * 60 * 1000
}));
// Setup the config for the tedious connection to the database
// Config files include the username, the password and the url of your database
// For testing purposes it can be set to localhost if need be.
// Good idea to make this variable global since all connections will be using
// the same config files from now on
var config = {
    userName: 'username',  
    password: 'password',  
    server: 'url for your database',  
    // When you connect to Azure SQL Database, you need these next options.  
    // In case of Azure the encrypt must be set to true
    // The database variable is set to the name of the database you want to access of course 
    options: { encrypt: true, database: 'coalbox-db', rowCollectionOnDone : true }
};
app.get('/', function (req, res, next) {
    res.render('index');
});
app.post('/getusers', function(req, res, next){
    // Can make this variable global if you intend to use it multiple times
    var Connection = require('tedious').Connection;
    // Passing the config variable which was defined earlier
    var connection = new Connection(config);
    // When a client issues a request it first connects to the database
    // An event called connect is fired called 'connect' which then moves on to 
    // execute the function which actually executes a SQL statement
    connection.on('connect', function (err) {
        if (err) return console.error(err);
        executeStatement();
    });
    
    var Request = require('tedious').Request;
    var TYPES = require('tedious').TYPES;
    
    function executeStatement() {
        var flag = false;
        sql = "Your sql statement here!";
        //console.log(sql);
        request = new Request(sql, function (err) {
            if (err) {
                console.log(err);
            }
        });
        // Whenever a SELECT statement returns a row a 'row' event is fired with all the columns requested
        // This means that if the SELECT statement doesn't return anything then the event is not fired
        // This event is also not fired in case of INSERT and UPDATE statements etc. for obvious reasons 
        request.on('row', function (columns) {
            // This functon gets all the columns in a row result
            // Log this onto the console to see the entire JSON data
            // console.log(columns)
            columns.forEach(function (column) {
                // For each column there is some data associated with it
                // column.metadata.colName gives the name of the columns
                // column.value gives the value of the column
                console.log(column.metadata.colName);
                console.log(column.value);
                // Setting session variables is as easy as following
                req.session.username = column.value;
            });
            // You can set the variables you want to return to your ajax call
            // In this case we are simply setting a flag to true which otherwise remains false
            // if the SELECT statement doesn't return any rows
            flag = true;
        });
        
        // Once the SQL statement is done executing then the 'done' event is fired
        // However at the time of writing this code 'done' doesn't seem to fire
        // As an alternative 'doneProc' can be used for pretty much the same thing
        // It takes in some parameters which also don't seem to work
        request.on('doneProc', function (rowCount, more, returnStatus, rows) {
            // We are returning the flag we set earlier to indicate wether the SELECT
            // statement gave some results or not
            res.send(flag);
        });
        // Actually execute the SQL request
        connection.execSql(request);
    }
});
// If you are producing a combined Web + Mobile app, then you should handle
// anything like logging, registering middleware, etc. here

// Configuration of the Azure Mobile Apps can be done via an object, the
// environment or an auxiliary file.  For more information, see
// http://azure.github.io/azure-mobile-apps-node/global.html#configuration
var mobileApp = azureMobileApps({
    // Explicitly enable the Azure Mobile Apps home page
    homePage : true,
    // Explicitly enable swagger support. UI support is enabled by
    // installing the swagger-ui npm module.
    swagger: true
});

// Import the files from the tables directory to configure the /tables endpoint
mobileApp.tables.import('./tables');

// Import the files from the api directory to configure the /api endpoint
mobileApp.api.import('./api');

// Initialize the database before listening for incoming requests
// The tables.initialize() method does the initialization asynchronously
// and returns a Promise.
mobileApp.tables.initialize()
    .then(function () {
        app.use(mobileApp);    // Register the Azure Mobile Apps middleware
        app.listen(process.env.PORT || 3000); 
        // Listen for requests
});
