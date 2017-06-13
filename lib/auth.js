var $fh = require('fh-mbaas-api');

var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');

var request = require('request');

var crypto = require('crypto');

var db = require('./db-store');

var USERS_COLLECTION_NAME = process.env.USERS_COLLECTION_NAME || "local-users";

function checkCredentials(username, password) {
  return new Promise(function(resolve, reject) {
    console.log('username', username, 'password', password);
    var filter = {
      eq: {
        username: username,
        password: crypto.createHash('md5').update(password).digest("hex")
      }
    };
    console.log('filter', filter);
    db.list(USERS_COLLECTION_NAME, filter, function (err, data) {
      if (err) {
        reject({status: 'error', statusCode: 500, message: err});
      } else {
        // Credentials are ok
        if (data && data.length == 1) {
          // TODO sessionToken still missing!
          console.log('Credentials for username', username, 'ok');
          resolve({status: 'ok', statusCode: 200, message: 'Successfully Authenticated', sessionToken: 'dummyToken', roles: data[0].roles});
        } else {
          // Wrong credentials
          console.error('Credentials for username', username, 'ko');
          reject({status: 'error', statusCode: 401, message: 'User unkonwn or wrong password'});
        }
      }
    });
  });
}

/*
 * Auth route to verify if a user can authenicate against an LDAP server
 */
function route() {
  var router = new express.Router();
  router.use(cors());
  router.use(bodyParser());

  // POST REST endpoint - note we use 'body-parser' middleware above to parse the request body in this route.
  // This can also be added in application.js
  // See: https://github.com/senchalabs/connect#middleware for a list of Express 4 middleware
  router.post('/', function(req, res) {
      console.log('Hi', req.body);
    //Must pass a username & password
    var username = req.body.username || req.body.userId;
    var password = req.body.password;
    if (!username || !password) {
      return res.status(500).json({'status': 'error','message': 'You need to provide a username and password.'});
    }

    checkCredentials(username, password)
    .then(function (result){
        res.status(result.statusCode).json(result);
    })
    .catch(function (err) {
        res.status(err.statusCode).json(err);
    });

  });

  return router;
}

module.exports = route;
