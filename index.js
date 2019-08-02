const express = require('express');
const app = express();

const basicAuth = require('basic-auth');
// Plaintext basic auth credentials for this site
const users = require('./auth.json');

app.set('port', (process.env.PORT || 5000));

/**
 * Basic auth middleware
 */
const auth = (req, res, next) => {
  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.sendStatus(401);
  }

  function validAuth(user) {
    for (let i = 0; i < users.length; i++) {
      if (users[i].name === user.name && users[i].pass === user.pass) {
        return true;
      }
    }
    return false;
  }

  // Check for basic auth credentials
  const user = basicAuth(req);

  // Block if none are found
  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  }

  // Check auth against users defined in `auth.json`
  if (validAuth(user)) {
    return next();
  } else {
    return unauthorized(res);
  }
};

app.use(auth);

app.use(express.static(`${__dirname}/dist`));

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
