const express = require('express');
const session = require('express-session');
const { Issuer, generators } = require('openid-client');
require('dotenv').config();
const db = require('./models/postgres'); // assumes your DB logic is in models/postgres.js

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
  const newClient = new issuer.Client({
    client_id: process.env.COGNITO_CLIENT_ID,
    client_secret: process.env.COGNITO_CLIENT_SECRET,
    redirect_uris: ['http://localhost:3000/callback'],
    response_types: ['code']
  });
  console.log('✅ OpenID client initialized');
  return newClient;
}).catch(err => {
  console.error('❌ Failed to initialize OpenID client:', err.message);
});

app.get('/', (req, res) => {
  const isAuthenticated = !!req.session.userInfo;
  res.render('home', {
    isAuthenticated,
    userInfo: req.session.userInfo || null
  });
});

// Login
app.get('/login', async (req, res) => {
  const client = await clientPromise;
  const state = generators.state();
  const nonce = generators.nonce();

  req.session.state = state;
  req.session.nonce = nonce;

  const authUrl = client.authorizationUrl({
    scope: 'openid email profile phone',
    state,
    nonce
  });

  res.redirect(authUrl);
});

// Callback
app.get('/callback', async (req, res) => {
  try {
    const client = await clientPromise;
    const params = client.callbackParams(req);

    const tokenSet = await client.callback('http://localhost:3000/callback', params, {
      state: req.session.state,
      nonce: req.session.nonce
    });

    console.log('🔐 Token Set:', tokenSet);
    const userInfo = await client.userinfo(tokenSet.access_token);
    req.session.userInfo = userInfo;

    res.redirect('/');
  } catch (err) {
    console.error('❌ Callback error:', err.message);
    res.status(500).send('Authentication failed');
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  const logoutUrl = `https://${process.env.COGNITO_DOMAIN}/logout?client_id=${process.env.COGNITO_CLIENT_ID}&logout_uri=http://localhost:3000`;
  res.redirect(logoutUrl);
});

// Optional: Test DB route
app.get('/test-db', async (req, res) => {
  try {
    const result = await db.getTasksByUser(1); // use real user_id or test SELECT 1
    res.send('✅ DB Connected. Sample query result:\n' + JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('❌ Test DB error:', err.message);
    res.status(500).send('Database connection failed: ' + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
