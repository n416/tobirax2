# tobirax2 — Auth0 OIDC mock

A fork of **tobira** with an OpenID Connect surface bolted on, so it can
stand in for **Auth0** during local development. You get tobira's nice
login UI, user/group management and 2FA, while Auth0 SDKs talk to it as
if it were a real OIDC provider.

> ⚠️ **Development mock only.** The RSA signing key is committed to this
> repo in plaintext (`src/oidc/keys.ts`). Anyone can forge tokens. Never
> expose this to anything that matters.

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
- **Client secrets are not validated** — it's a mock. PKCE *is* verified
  (S256 / plain).
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
  clientSecret: 'unused-but-required-by-sdk',
  authorizationParams: { response_type: 'code', scope: 'openid profile email' },
})
```

### Next.js (`@auth0/nextjs-auth0`)
```
AUTH0_ISSUER_BASE_URL=http://localhost:8787
AUTH0_CLIENT_ID=<the app id>
AUTH0_CLIENT_SECRET=unused-but-required
AUTH0_BASE_URL=http://localhost:3000
```

## Rotating the signing key
```bash
node -e "const{generateKeyPairSync}=require('crypto');const{publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:2048});console.log(JSON.stringify({priv:privateKey.export({format:'jwk'}),pub:publicKey.export({format:'jwk'})}))"
```
Paste `priv` into `PRIVATE_JWK` in `src/oidc/keys.ts`.
