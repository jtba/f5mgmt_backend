"use strict";

let routes = require("./routes"),
    config = require('./config'),
    express = require("express"),
    router = express.Router(),
    app = express(),
    bodyParser = require('body-parser');

app.use(routes.cors);
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


app.post('/cluster_management', function (req, res) {
    console.log("Test post responded to.");
    res.json({message: "Hello from the " + process.env.SERVER_ENVIRONMENT + " Cluster Management API!"});
});

app.post('/cluster_management/auth', routes.authUser);

//app.post('/cluster_management/login', routes.login);

app.post('/cluster_management/pools', routes.getPools);

app.get('/cluster_management/pools/:id', routes.getPool);

app.get('/cluster_management/pools/:id/members', routes.getPoolMembers);

app.put('/cluster_management/members/:action', routes.manageMembers);



app.listen(config.API_PORT);
console.log('API is listening on port ' + config.API_PORT);