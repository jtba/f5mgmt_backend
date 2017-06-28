"use strict"

let helpers = require('./helpers'),
    config = require('./config'),
    forEachAsync = require('forEachAsync').forEachAsync;

/**
 * [getAuth] This function takes the encoded credentials from the front end, decodes them, then re-encodes them to include
 * the email address for use with the ldap api. After their credentials are authenticated, it contacts the F5 API to collect
 * the permissions and partitions they are allowed to access. It then passes a "success" statement along with an object
 * that has the permissions and partitions defined by the F5 API
 * @param   {String}    encodedCredentials - A base 64 encoded string for basic authentication created by the front end
 * @returns {Promise}   response - Object including a status, the permissions and partitions the user has access to
 */
exports.getAuth = function (encodedCredentials){
    return new Promise(function(resolve, reject) {
        let credentials = getUserPass(encodedCredentials),
            returnData = {};
        encodeForLDAPAndTest(credentials).then(function (authenticated) {
            if (authenticated) {
                getUserFromF5(credentials).then(function (permissions) {
                    if (permissions !== false) {
                        returnData.permissions = permissions;
                        getPartitions(permissions.partitionAccess[0].name).then(function (partitionObject) {
                            returnData.partitions = partitionObject;

                            let response = {
                                "status": "success",
                                "results": returnData

                            };
                            resolve(response);

                        });
                    }
                });
            } else {
                //TODO failed auth response
                resolve(false);
            }
        })
    });
};

/**
 * [disableMembers] This function disables pool members defined in the PoolData array
 * @param   {array}     poolData        An object array that has a list of pool members to be disabled
 * @returns {Promise}   responseArray   An object that includes the response from the F5 API after disabling the pools
 */
exports.disableMembers = function (poolData){
    return new Promise(function(resolve, reject) {
        let responseArray = [],
            disable = {
            "state": "user-up",
            "session": "user-disabled"
        };
        poolData.forEach(function(element, index){
            let properUri = element.f5Uri + 'mgmt/tm/ltm/pool/' + encodeURIComponent(element.poolName) + '/members/~Common~' + encodeURIComponent(element.memberName);
            helpers.disablePools(properUri, disable).then(function(response){
                responseArray.push(response);
            })
        })
        resolve(responseArray);
    });
};

/**
 * [enableMembers] This function enables pool members defined in the poolData array
 * @param   {array}     poolData        An object array that has a list of pool members to be enabled
 * @returns {Promise}   responseArray   An object that includes the response from the F5 API after enabling the pools
 */
exports.enableMembers = function (poolData){
    return new Promise(function(resolve, reject) {
        let responseArray = [],
            enable = {
                "state": "user-up",
                "session": "user-enabled"
            };
        poolData.forEach(function(element, index){
            let properUri = element.f5Uri + 'mgmt/tm/ltm/pool/' + encodeURIComponent(element.poolName) + '/members/~Common~' + encodeURIComponent(element.memberName);
            helpers.enablePools(properUri, enable).then(function(response){
                responseArray.push(response);
            })
        })
        resolve(responseArray);
    });
};

/**
 * [getUserFromF5] This function takes the decoded credentials object and uses the username to check with the F5 api
 * to see if the specific user has permission to "work" in the F5
 * @param   {object}    credentials     Decoded username and password
 * @returns {Promise}   f5User          An object that has permissions allowed passed back from the F5 api
 */
function getUserFromF5(credentials) {
    return new Promise(function (resolve, reject) {
        let user = credentials.user,
            userFound = false,
            server = config.F5LIST[0].concat("mgmt/tm/auth/user");

        helpers.getF5UserList(server).then(function (userList) {
            userList.items.forEach(function (f5User, index) {
                if (user.toLowerCase() === f5User.name.toLowerCase()) {
                    userFound = true;
                    resolve(f5User);
                }
            });
            if(userFound === false){
                resolve(false);
            }
        })
    })

};

/**
 * [getPartitions] This function takes the partition access defined by the current users settings in the F5, and collects
 * the partitions the user is allowed to modify based on their permissions
 * @param   {object}    partitionAccessName     An object that has the defined access level the current user has in F5
 * @returns {Promise}   partitionObject         An object that includes the partition(s) the user is allowed to access
 */
function getPartitions (partitionAccessName){
    return new Promise(function (resolve, reject) {
        let server = config.F5LIST[0].concat("mgmt/tm/sys/folder");
        helpers.getF5Access(server, partitionAccessName).then(function (partitionObject){
            resolve(partitionObject);
        })


    })
};