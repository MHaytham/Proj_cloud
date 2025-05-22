const express = require('express');
const { Issuer, generators } = require('openid-client');
require('dotenv').config();

const router = express.Router();
let client;

async function initClient() {
  const issuer = await Issuer.discover(`https://cognito-idp.${process.env.COGNITO_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`);
  client = new issuer.Client({
    client_id: process.env.COGNITO_APP_CLIENT_ID,
    redirect_uris: [process.env.COGNITO_REDIRECT_URI],
    response_types: ['code']
  });
}
initClient().catch(console.error);

function checkAuth(req, res, next) {
  req.isAuthenticated = !!req.session.userInfo;
  next();
}

// Home
router.get('/', checkAuth, (req, res) => {
  res.render('home', {
    isAuthenticated: req.isAuthenticated,
    userInfo: req.session.userInfo
  });
});

// Login
router.get('/login', (req, res) => {
  const state = generators.state();
  const nonce = generators.nonce();

  req.session.state = state;
  req.session.nonce = nonce;

  const authUrl = client.authorizationUrl({
    scope: 'openid email profile',
    state,
    nonce
  });

  res.redirect(authUrl);
});

// Callback
router.get('/callback', async (req, res) => {
  try {
    const params = client.callbackParams(req);
    const tokenSet = await client.callback(
      process.env.COGNITO_REDIRECT_URI,
      params,
      {
        nonce: req.session.nonce,
        state: req.session.state
      }
    );

    const userInfo = await client.userinfo(tokenSet.access_token);
    req.session.userInfo = userInfo;
    res.redirect('/');
  } catch (err) {
    console.error('Callback error:', err);
    res.redirect('/');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  const logoutUrl = `https://${process.env.COGNITO_DOMAIN}/logout?client_id=${process.env.COGNITO_APP_CLIENT_ID}&logout_uri=${process.env.COGNITO_REDIRECT_URI}`;
  res.redirect(logoutUrl);
});

module.exports = router;
