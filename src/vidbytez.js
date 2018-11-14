/*   Vidbytez
 *   (c) Trigex 2018
 *   Licensed under the MIT License
*/

const config = require('../config.json');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const generalRoutes = require("./routes/routes");
const apiRoutes = require("./routes/api");
const fileUpload = require('express-fileupload');

mongoose.connect("mongodb://" + config.app.database.host + ":" + config.app.database.port + "/" + config.app.database.database, {useNewUrlParser: true});

app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
    secret: config.app.session.secret,
    saveUninitialized: true,
    resave: true,
    cookie: {expires: new Date(config.app.session.expires)}
}));

app.use(express.static(__dirname + '/static'));
app.use(fileUpload());
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

generalRoutes(app);
apiRoutes(app);

app.listen(config.app.server.port, function(){
    console.log("The HTTP server is listening on 127.0.0.1 on port " + config.app.server.port);
});