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
        reject({status: 500, message: err});
      } else {
        // Credentials are ok
        if (data && data.count == 1) {
          // TODO sessionToken still missing!
          resolve({status: 200, message: 'Successfully Authenticated', sessionToken: 'dummyToken'});
        } else {
          // Wrong credentials
          resolve({status: 401, message: 'User unkonwn or wrong password'});
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
        res.status(err.status).json(err);
    })
    .catch(function (err) {
        res.status(err.status).json(err);
    });

  });

  router.post('/old', function(req, res) {
      console.log('Hi', req.body);
    //Must pass a username & password
    var username = req.body.username || req.body.userId;
    var password = req.body.password;
    if (!username || !password) {
      return res.status(500).json({'status': 'error','message': 'You need to provide a username and password.'});
    }

    var options = {
      "act": "list",
      "type": "local-users",
      "eq": {
        "username": username,
        "password": crypto.createHash('md5').update(password).digest("hex")
      }
    };
    $fh.db(options, function(err, data){
      if (err){
        console.log("ERROR ", err);
        res.status(500).json({'status': 'unauthorised','message': 'Unkown error in the backend'});
      } else {
        // Credentials are ok
        if (data.count == 1) {
          // TODO sessionToken still missing!
          res.status(200).json({'status': 'ok','message': 'Successfully Authenticated', 'sessionToken' : 'dummytoken'});
        } else {
          res.status(401).json({'status': 'unauthorised','message': 'User unkonwn or wrong password'});
        }
      }
    });

  });

  return router;
}

module.exports = route;
