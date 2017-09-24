/*
* Handling communication between our server and lyft API
*/

/* global configuration */
require('dotenv').config();
var expressSession = require('express-session');
var lyft = require('node-lyft');
var defaultClient = lyft.ApiClient.instance;
var request = require('request');


/*
* Authorization
*/
exports.handleAuthorization = function (req, res, state, next) {
  /* store state in session */
  req.state = state;
  /* redirect with state */
  res.redirect(
    process.env.LYFT_API_URI + '/oauth/authorize'
    + '?client_id='     + process.env.LYFT_CLIENT_ID
    + '&response_type=' + 'code'
    + '&scope='         + 'offline%20public%20profile%20rides.read%20rides.request'
    + '&state='         + state
  );
};

exports.handleLanding = function (req, res, next) {
  /* compare session state to returned state */
  if (req.session.state === req.query.state) {
    /* state is valid; save code */
    req.session.lyftAuthorizationCode = req.query.code;
    /* NOTE:
     * You should store the code in a secure database. Keeping the authorization code in
     * the session alone is not particularly secure, and when it expires the user will
     * have to go through the oauth authorization process again. You can greatly improve
     * the user experience by storing that code securely with your own user_id
     * implementation. This is where you should do that.
     */
    res.redirect('/');
  } else {
    /* state is invalid; discard code */
    res.redirect('/');
  }
};

exports.handleRevocation = function (req, res, next) {
  res.redirect(
    process.env.LYFT_WWW_URI
  );
};

exports.finalAuthorization = function (req, res, next) {

  var headers = {
      'Content-Type': 'application/json'
  };

  var dataString = '{"grant_type": "authorization_code", "code": "'+req.query.code+'"}';

  var options = {
      url: 'https://api.lyft.com/oauth/token',
      method: 'POST',
      headers: headers,
      body: dataString,
      auth: {
          'user': process.env.LYFT_CLIENT_ID,
          'pass': process.env.LYFT_CLIENT_SECRET
      }
  };

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
          console.log("haha sweaty");
          console.log(body);
      }
  }

  request(options, callback);
}
