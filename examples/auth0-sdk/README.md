# Example: real Auth0 SDK against tobirax2

> 🇯🇵 日本語版は [README_ja.md](README_ja.md) を参照。

A minimal relying party built with **`express-openid-connect`** — Auth0's
**official** Express SDK — pointed at tobirax2 instead of a real Auth0 tenant.

If this logs you in, it proves tobirax2 is accepted as a standard OIDC
provider by a real Auth0 library: the SDK reads our discovery document,
fetches the JWKS, and **verifies the RS256 `id_token` signature + `iss` /
`aud` / `nonce`** before establishing a session. None of it is hand-waved.

The only line that differs from a real Auth0 setup is `issuerBaseURL`:

```js
issuerBaseURL: 'http://localhost:8787', // tobirax2 (normally https://YOUR.auth0.com)
clientID:      'app-test-1',
clientSecret:  'test-secret-abc123',    // confidential client (see scripts/seed-test.sql)
```

## Prerequisites

From the repo root, with the local D1 seeded:

```bash
# in the repo root
npm install
npx wrangler d1 execute tobira-mock-db --local --file ./schema.sql
npx wrangler d1 execute tobira-mock-db --local --file ./scripts/seed-test.sql
npm run dev        # IdP on http://localhost:8787
```

`seed-test.sql` registers the client `app-test-1` (redirect prefix
`http://localhost:3000`), grants the test user access, and creates a login:
**tester@example.com / admin1234**.

## Run

```bash
cd examples/auth0-sdk
npm install
node index.js      # RP on http://localhost:3000
```

Open <http://localhost:3000> → **ログイン（Auth0 SDK経由）** → log in at the
tobira screen → you land back on a page showing the verified `id_token`
claims. Visiting again logs you straight in (SSO via the tobira session).

> Development only. Do not point this at anything real.
