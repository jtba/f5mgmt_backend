"use strict";

let config = require('./config'),
    logic = require('./logic'),
    forEachAsync = require('forEachAsync').forEachAsync,
    helpers = require('./helpers');

exports.cors = function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT")
    next();
};

/**
 * [login] - NOT CURRENTLY USED - This function was designed to work with the "new" Cluster management front end
 * login. At this point it does function and may be adapted
 * to the current ui so it has not been removed
 * @param {object}  req     Request coming in from front end, including authorization headers
 * @param {object}  res     Response based on if the user was authenticated
 */
exports.login = function(req, res){
    let returnData={};
    if (req.headers.authorization){
        let encodedCredentials = req.headers.authorization;

            logic.auth(encodedCredentials).then(function(authData){
                returnData.status = "success";
                returnData.results = authData;
                res.status(200).json(returnData);
        })
    }else{
        res.status(401).json("Login error");
    }
};

/**
 * [authUser] - This function is used by the required login on the front end for the instance when a user chooses
 * to either enable or disable pools. It takes the users credentials and tests them with the ldap api to confirm that
 * they are a user, and have the correct permissions in the F5
 * @param {object}  req     Request sent by front end, the body has an authstring that is the encoded credentials
 * @param {object}  res     Either a successful authentication object or false to designate a fail
 */
exports.authUser = function(req, res){
    let encodedCredentials = req.body.authstring;
    logic.getAuth(encodedCredentials).then(function(response){
        if (response !== false){
            res.status(200).json(response);
        } else {
            res.status(401).json("false");
        }
    })
};

/**
 * [getPools] - This function collects all the pools to be shown on the front end from the f5
 * @param {object}  req     Request object not used in the function
 * @param {object}  res     Response object containing an object array with the list of servers
 */
exports.getPools = function(req, res){
    let serverList=[],
        successWrapper={};

        forEachAsync(config.F5LIST, function (next, server) {
            helpers.getF5List(server.concat("mgmt/tm/ltm/pool"), function (response) {
                let results={};
                results.name = server;
                results.data = response;
                serverList.push(results);
                next();
            });
        }).then(function () {
            successWrapper.status = "success";
            successWrapper.results = serverList;
            res.status(200).json(successWrapper);
        });

};


exports.getPool = function(req, res){

};

exports.getPoolMembers = function(req, res){

};

/**
 * [manageMembers] - This function takes the users credentials and confirms they should have access and be able to
 * manage the pools. It then confirms the 'action' sent back from the front end is what is expected, and either enables
 * or disables pools using the f5 api
 * @param {object}  req     Request object contains authorization headers and the 'action' in the parameters
 * @param {object}  res     Response object
 */
exports.manageMembers = function(req, res){

    if (req.headers.authorization) {
        logic.getAuth(req.headers.authorization).then(function(authData){
            if (helpers.validateRole(authData.results.permissions.partitionAccess[0].role, 'managepools')) {
                switch (req.params.action) {
                    case "enable":
                        logic.enableMembers(req.body).then(function(response){
                            res.status(200).json(response);
                        });
                        break;
                    case "disable":
                        logic.disableMembers(req.body).then(function(response){
                            res.status(200).json(response);
                        });
                        break;
                    default:
                        res.status(500).json("Action not recognized");
                        break;
                }
            }
        })
    } else {
        //TODO failed auth response
        res.status(401).json("false");
    }
};