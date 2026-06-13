// Demo relying party using Auth0's OFFICIAL SDK (express-openid-connect),
// pointed at tobirax2 instead of a real Auth0 tenant.
// If this logs you in, a real Auth0 SDK accepts tobirax2 as an OIDC provider.
//
//   npm install
//   node index.js   -> http://localhost:3000
const express = require('express')
const { auth } = require('express-openid-connect')

const app = express()

app.use(
  auth({
    // ↓ This is the only thing that differs from a real Auth0 setup:
    issuerBaseURL: 'http://localhost:8787', // tobirax2 (normally https://YOUR.auth0.com)
    clientID: 'app-test-1',
    clientSecret: 'unused-by-the-mock-but-required-by-sdk',
    baseURL: 'http://localhost:3000',
    secret: 'demo-cookie-secret-please-use-something-longer-in-real-life',
    idpLogout: true,
    authorizationParams: {
      response_type: 'code', // Authorization Code flow
      scope: 'openid profile email',
    },
  })
)

app.get('/', (req, res) => {
  if (req.oidc.isAuthenticated()) {
    res.type('html').send(`
      <body style="font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;line-height:1.6">
        <h1>✅ Auth0公式SDKでログイン成功</h1>
        <p><b>${req.oidc.user.email}</b> としてログイン中。<br>
        このページは <code>express-openid-connect</code>（Auth0公式）が、
        tobirax2 の discovery → JWKS → id_token検証 を通した結果です。</p>
        <h3>id_token クレーム（SDKが検証済み）</h3>
        <pre style="background:#f5f5f5;padding:12px;border-radius:8px">${JSON.stringify(req.oidc.idTokenClaims, null, 2)}</pre>
        <p><a href="/logout">ログアウト</a></p>
      </body>`)
  } else {
    res.type('html').send('<body style="font-family:system-ui;margin:40px"><a href="/login">ログイン（Auth0 SDK経由）</a></body>')
  }
})

// Machine-readable, for headless checking.
app.get('/me', (req, res) =>
  res.json({ authenticated: req.oidc.isAuthenticated(), claims: req.oidc.idTokenClaims || null })
)

app.listen(3000, () => console.log('demo-auth0 RP on http://localhost:3000'))
