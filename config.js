"use strict";

let helpers = require('./helpers');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

exports.API_PORT = '9000';
exports.ITT_APP_NAME = "Cluster Management API";
exports.ITT_ORIGIN_TYPE = "server";

switch (process.env.SERVER_ENVIRONMENT) {
    case 'local':
        var environmentObject = helpers.getLocalEnvironment();
        break;
    case 'pre-production':
        var environmentObject = helpers.getPreProdEnvironment();
        break;
    case 'production':
        var environmentObject = helpers.getProductionEnvironment();
        break;
    default:
        var environmentObject = helpers.getDefaultEnvironment();
        break;
};

exports.auth = helpers.getBase64Encode(process.env.F5_LOGIN + ':' + process.env.F5_PASS);

exports.LDAP_API = "putyourapihere";
exports.F5LIST = environmentObject.F5LIST;

if (environmentObject.problem === true) {
    log.Error("Server Environment was not recognized: " + process.env.SERVER_ENVIRONMENT, "config.js");
    process.exit(1);
}