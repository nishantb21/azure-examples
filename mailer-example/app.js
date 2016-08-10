// Tutorial on how to send a mail only to an existing email ID 
// Libraries used - node-mailer, email-existence, async


// An almost standard azure out-of-the-box setup
// For this example it is assumed that the user has their own SMTP server or a Gmail ID
// Gmail ID example can also be replicated for other well known mailing sites
// This tutorial also assumes that JQuery Ajax is used to call the APIs defined by this example
var express = require('express'),
azureMobileApps = require('azure-mobile-apps');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var nodemailer = require('nodemailer');
var emailExistence = require('email-existence');
// Using async.waterfall for sequential execution of functions
var async = require('async');
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
app.post('/sendmail', function(req, res, next) {
    // This API assumes that the email is passed through the the ajax query
    // async.waterfall has a list of functions which it executes one by one 
    // followed by a function which is executed at the end regardless of the 
    // execution of the list of functions
    // Each function in the list is passed the callback to the next function 
    // using the parameter done
    // Here we first check if the email exists using email-existence and set a flag 
    // accordingly.
    // We pass this flag to the following function which sends a mail to that email ID
    // in case the mail exists.
    async.waterfall([
        function(done){
            var checkmailpass;
            emailExistence.check(req.body.email, function(err,result){
                // result is true or false depending on the email ID given
                checkmailpass = result;
            });
            // Call the next function in the list passing checkmailpass as the parameter
            done(null,checkmailpass);
        },
        function(checkmailpass,done){
            if (checkmailpass == true){
                // The following code is for a custom SMTP server set up
                var smtpTransport = nodemailer.createTransport({
                    host: 'hostname of the server(NOT the email ID)',
                    auth: {
                        user: 'username',
                        pass: 'password'
                    }
                    /*
                    // Enable Less Secure Apps for the gmail is being used here
                    // Otherwise gmail accounts this as a hijack attempt on the gmail account
                    // For more information follow this link : https://nodemailer.com/using-gmail/
                    service: "Gmail",
                    auth: {
                        user: "******@gmail.com",
                        pass: "*****"
                    }
                    */
                });
                // The following is the actual mail which will be sent to the client 
                // Options are fairly obvious
                var mailOptions = {
                    to: req.body.email,
                    from: 'The email ID of the SMTP server',
                    subject: 'Some subject here!',
                    text: 'Email body here!'
                };
                smtpTransport.sendMail(mailOptions, function (err) {
                    // This function is the callback called after the mail has been sent/failed
                    if (err) console.log(err);
                    else console.log('Mail Sent!');
                });
            }
            // Call the final routine
            done(null,checkmailpass,'done');

        }],function(err, checkmailpass){
            // Send the flag to the ajax issuing client
            res.send(checkmailpass);
    });
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
