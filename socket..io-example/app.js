// Tutorial on how to use xhr-polling on azure websites
// Libraries used - socket.io


// An almost standard azure out-of-the-box setup
// Although for socket.io to work with azure websites
// enabling sockets is important which can be done in the settings 
var express = require('express'),
azureMobileApps = require('azure-mobile-apps');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var socketio = require('socket.io');
//Holds all the socket.io clients to our server
var socketClient = {};

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

app.get('/', function (req, res, next) {
    res.render('index');
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
        // When app.listen is called on any express app it returns a server
        // In all my trials only this worked and gave back a server to user as a socket server
        // So set the variable app.listen as the socket.io server and go ham
        var server = app.listen(process.env.PORT || 3000); 
        var io = socketio.listen(server);
        // Event fired when a client connects to the socket.io as a client
        // Add the ID socket.io sets for that client to the list of clients
        io.on('connection', function(socket){
            console.log('A user connected!');
            socketClient[socket.id] = socket;
            socket.on('disconnect', function(){
                // Once the client is done remove it from the list of clients
                delete socketClient[socket.id]
            });
        });
        // Listen for requests
});
