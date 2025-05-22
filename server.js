const express = require('express');
const session = require('express-session');
const { Issuer, generators } = require('openid-client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(session({
  secret: 'some secret',
  resave: false,
  saveUninitialized: false
}));

app.set('view engine', 'ejs');
app.set('views', './views');

let client;

// Initialize OpenID client using Cognito
const clientPromise = Issuer.discover(
  `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`
).then(issuer => {
  client = new issuer.Client({
    client_id: process.env.COGNITO_CLIENT_ID,
    client_secret: process.env.COGNITO_CLIENT_SECRET,
    redirect_uris: ['http://localhost:3000/callback'],
    response_types: ['code']
  });
  console.log('✅ OpenID client initialized');
  return client;
}).catch(err => {
  console.error('❌ Failed to initialize OpenID client:', err.message);
});

// Root route
app.get('/', (req, res) => {
  const isAuthenticated = !!req.session.userInfo;
  res.render('home', {
    isAuthenticated,
    userInfo: req.session.userInfo || null
  });
});

// Login route
app.get('/login', async (req, res) => {
  const client = await clientPromise;
  const nonce = generators.nonce();
  const state = generators.state();

  req.session.nonce = nonce;
  req.session.state = state;

  const authUrl = client.authorizationUrl({
  scope: 'openid email profile phone', // Must match what's enabled in Cognito
  state: state,
  nonce: nonce
});


  res.redirect(authUrl);
});


// Callback route
app.get('/callback', async (req, res) => {
  try {
    const params = client.callbackParams(req);
    const tokenSet = await client.callback('http://localhost:3000/callback', params, {
  nonce: req.session.nonce,
  state: req.session.state
});

console.log("🔍 Token Set:", tokenSet); // Add this line

const userInfo = await client.userinfo(tokenSet.access_token); // This line fails if token is missing

    req.session.userInfo = userInfo;

    res.redirect('/');
  } catch (err) {
  console.error('Callback error:', err);
  res.send('Authentication failed');
}

});



// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy();
  const logoutUrl = `https://${process.env.COGNITO_DOMAIN}/logout?client_id=${process.env.COGNITO_CLIENT_ID}&logout_uri=http://localhost:3000`;
  res.redirect(logoutUrl);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
