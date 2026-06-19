# tobirax2 — Auth0 OIDC mock

> 🇯🇵 日本語版は [OIDC_MOCK_ja.md](OIDC_MOCK_ja.md) を参照。

A fork of **tobira** with an OpenID Connect surface bolted on, so it can
stand in for **Auth0** during local development. You get tobira's nice
login UI, user/group management and 2FA, while Auth0 SDKs talk to it as
if it were a real OIDC provider.



## What it implements

| Endpoint | Purpose |
|---|---|
| `GET /.well-known/openid-configuration` | Discovery document |
| `GET /.well-known/jwks.json` | Public key (RS256) for id_token verification |
| `GET /authorize` | Authorization Code flow (PKCE supported) |
| `POST /oauth/token` | `authorization_code` + `refresh_token` grants → `id_token` (RS256 JWT) + opaque `access_token` |
| `GET\|POST /userinfo` | OIDC claims for a Bearer access_token |
| `GET /oidc/logout` | RP-initiated logout (`post_logout_redirect_uri` / `returnTo`) |

Notes:
- `access_token` is **opaque** (resolved at `/userinfo`), matching Auth0's
  default when no API audience is configured. `id_token` is a real RS256 JWT.
- **Client authentication is enforced.** An app with a `client_secret`
  registered is a *confidential* client — the secret is required at the
  token endpoint and compared in constant time. An app with no secret is a
  *public* client and must use PKCE (S256 only) instead.
- tobira's **per-app permission gate is enforced** at `/authorize`: if the
  user has no valid permission for the app, the RP gets `error=access_denied`.

## Setup

```bash
npm install

# create the local D1 schema
npx wrangler d1 execute tobira-mock-db --local --file ./schema.sql

# (existing DB only) add OIDC columns to auth_codes
# npx wrangler d1 execute tobira-mock-db --local --file ./scripts/oidc-migration.sql

npm run dev   # -> http://localhost:8787
```

Create an admin + user with the helper in `scripts/manage-admin.*`, then log
in once at `http://localhost:8787/login`.

## Registering a client (the relying party)

In the **admin UI → Apps**, add an app:

- **name** — anything
- **base_url** — the prefix your `redirect_uri` must start with,
  e.g. `http://localhost:3000`

The app's **id** is your `client_id`. Grant the user (or their group)
permission to that app, or `/authorize` will return `access_denied`.

A new app is created as a **confidential** client: a `client_secret` is
generated and shown in the edit modal — copy it into your backend SDK
config. For a **public** client (SPA, e.g. `@auth0/auth0-react`), open the
edit modal and click **Make public (SPA)** to clear the secret; PKCE is then
required instead.

## Point your Auth0 SDK at it

Use the issuer **without** a trailing slash: `http://localhost:8787`.

### React SPA (`@auth0/auth0-react`)
```tsx
<Auth0Provider
  domain="localhost:8787"          // issuer origin
  clientId="<the app id>"
  authorizationParams={{ redirect_uri: window.location.origin }}
  // auth0-react uses Authorization Code + PKCE automatically
/>
```
If the SDK forces `https://${domain}`, set `domain` to your https tunnel or
run the mock behind https.

### Express (`express-openid-connect`)
```js
auth({
  issuerBaseURL: 'http://localhost:8787',
  baseURL: 'http://localhost:3000',
  clientID: '<the app id>',
  clientSecret: '<the client_secret from the admin edit modal>',
  authorizationParams: { response_type: 'code', scope: 'openid profile email' },
})
```

### Next.js (`@auth0/nextjs-auth0`)
```
AUTH0_ISSUER_BASE_URL=http://localhost:8787
AUTH0_CLIENT_ID=<the app id>
AUTH0_CLIENT_SECRET=<the client_secret from the admin edit modal>
AUTH0_BASE_URL=http://localhost:3000
```

## Signing key

The RS256 keypair is generated lazily on first use and stored in the
`system_config` table (`oidc_keys` row) — unique per database, never in
source. To rotate it (invalidating existing tokens), delete the row and let
the next request regenerate:

```bash
npx wrangler d1 execute tobira-mock-db --local --command "DELETE FROM system_config WHERE key='oidc_keys';"
```
