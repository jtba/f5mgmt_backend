"use strict";

let request = require("request-promise"),
    config = require('./config'),
    validUrl = require('valid-url'),
    base64 = require('base-64'),
    helpers = require('./helpers'),
    utf8 = require('utf8');

/*
*   Define variables based on the environment you're running the application in
*
*/

module.exports = {

    getLocalEnvironment: function () {
        let localEnvironment = {
            F5LIST: [
                "f5url",
                "f5url"
            ],
            problem: false
        };
        return localEnvironment;
    },
    getPreProdEnvironment: function () {
        let preProdEnvironment = {
            F5LIST: [
                "f5url",
                "f5url"
            ],
            problem: false
        };
        return preProdEnvironment;
    },
    getProductionEnvironment: function () {
        let productionEnvironment = {
            F5LIST: [
                "f5url",
                "f5url",
                "f5url"
            ],
            problem: false
        };
        return productionEnvironment;
    },
    getDefaultEnvironment: function () {
        let defaultEnvironment = {
            problem: true
        };
        return defaultEnvironment;
    },
    getF5List: function (uri, next) {
        if (validUrl.is_https_uri(uri)) {
            const options = {
                method: "GET",
                url: uri,
                qs: {
                    expandSubcollections: true
                },
                headers: {
                    Authorization: 'Basic ' + config.auth,
                    'Content-Type': 'application/json'
                },
                json: true
            }
            request(options)
                .then(function (res) {
                    next(res);
                })
                .catch(function (err) {
                    if (err.statusCode == '401') {
                        //console.log("Unauthorized access to F5, check credentials"); //DEBUG
                    }
                    console.log("ERROR: " + err);//DEBUG
                    next(err);
                });
        } else {
            //console.log("Not a valid uri: " + uri);//DEBUG
        }

    }, // Helper functions for base64 encoding/decoding
    getBase64Encode: function (authString) {
        let bytes = utf8.encode(authString),
            encoded = base64.encode(bytes);

        return encoded;
    },
    getBase64Decode: function (authString) {
        let bytes = base64.decode(authString),
            decoded = utf8.decode(bytes);

        return decoded;

    }, // If using an ldap rest API, this will auth you via LDAP
    userLdapAuth: function (encoded, next) {
        const options = {
            method: "GET",
            url: config.LDAP_API,
            headers: {
                Authorization: 'Basic ' + encoded,
                'Content-Type': 'application/json'
            },
            json: true
        }
        request(options)
            .then(function (res) {
                next(res.auth);
            })
            .catch(function (err) {
                //console.log("ERROR: " + err);//DEBUG
                next(false);
                log.Error("LDAP error " + err, "helpers.userLdapAuth");
            })
    }, // Gather all users within an F5 device
    getF5UserList: function (uri) {

        return new Promise(function (resolve, reject) {

            let userList = [];
            const options = {
                method: "GET",
                url: uri,
                headers: {
                    Authorization: 'Basic ' + config.auth,
                    'Content-Type': 'application/json'
                },
                json: true
            }
            request(options)
                .then(function (res) {
                    resolve(res);
                })
                .catch(function (err) {
                    reject(err);
                });


        });
    }, //Identify what permissions a user has in the F5
    getF5Access: function (uri, access) {
        return new Promise(function (resolve, reject) {
            let partitionList = [],
                options = {};
            if (access === "all-partitions") {
                options = {
                    method: "GET",
                    url: uri,
                    headers: {
                        Authorization: 'Basic ' + config.auth,
                        'Content-Type': 'application/json'
                    },
                    json: true
                }
            }
            else {
                options = {
                    method: "GET",
                    url: uri.concat('/~' + access),
                    headers: {
                        Authorization: 'Basic ' + config.auth,
                        'Content-Type': 'application/json'
                    },
                    json: true
                }
            }
            request(options)
                .then(function (res) {
                    resolve(res);
                })
                .catch(function (err) {
                    console.log("getF5Access error: " + err);

                })
        });
    }, // Validate that the role of a user has appropriate permissions to perform F5 actions
    validateRole: function (role, action){
        switch(action){
            case 'managepools':
                if(role.toLowerCase() === 'operator' || role.toLowerCase() === 'administrator'){
                    return true;
                }
                break;
            case 'getpools':
                if(role.toLowerCase() !== 'no access'){
                    return true;
                }
                break;
            default:
                    return false;
        }
        return false;
    }, // Method to disable pool members so they no longer take traffic
    disablePools: function (uri, disable){
        return new Promise(function (resolve, reject) {
            const options = {
                method: "PUT",
                url: uri,
                headers: {
                    Authorization: 'Basic ' + config.auth,
                    'Content-Type': 'application/json'
                },
                json: disable
            }
            request(options)
                .then(function (res) {
                    console.log(res);
                    resolve(res);
                })
                .catch(function (err) {
                    console.log(err);
                    resolve(err);
                });


        });

    }, // Method to enable traffic to pool instances
    enablePools: function (uri, enable){
        return new Promise(function (resolve, reject) {
            const options = {
                method: "PUT",
                url: uri,
                headers: {
                    Authorization: 'Basic ' + config.auth,
                    'Content-Type': 'application/json'
                },
                json: enable
            }
            request(options)
                .then(function (res) {
                    resolve(res);
                })
                .catch(function (err) {
                    reject(err);
                });


        });

    }


};