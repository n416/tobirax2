# Tobira 🚪

> **A self-hosted OpenID Connect Identity Provider on Cloudflare Workers + D1.**
> 🇯🇵 日本語は [README_ja.md](README_ja.md) を参照。

**Tobira** is an OpenID Connect (OIDC) **Identity Provider** that runs entirely on
Cloudflare Workers + D1. It speaks the Authorization Code flow (with PKCE) so any
standard OIDC client / SDK can use it for login, while you keep full control of
your users, groups and permissions in your own D1 database.

> It began as a fork of the original *tobira* auth starter kit (a "no-OIDC"
> embedded-auth boilerplate). It has since grown a full OIDC surface and is now
> an IdP in its own right. For point-to-it-with-an-SDK instructions and an
> Auth0-compatibility cheat sheet, see **[OIDC_MOCK.md](OIDC_MOCK.md)**.

---

## ✨ Features

* **Standard OIDC provider** — Discovery, JWKS, Authorization Code + PKCE,
  refresh tokens, UserInfo, RP-initiated logout.
* **Re-authentication controls** — honours `prompt` (`none` / `login` /
  `select_account`) and `max_age`, and emits a real `auth_time` claim reflecting
  when the user actually authenticated (preserved across refresh).
* **Real RS256 id_tokens** — signing keys are generated per-database, **encrypted
  at rest** (AES-256-GCM via the `OIDC_KEK` secret) and **rotated automatically**
  with an overlapping JWKS window so in-flight tokens keep verifying.
* **Confidential & public clients** — apps with a `client_secret` are confidential
  (secret checked in constant time); secretless apps are public and must use PKCE.
* **Built-in authorization** — a per-app permission gate is enforced at
  `/authorize`; users without a valid grant get `access_denied`.
* **Full user lifecycle** — admin UI for users / groups / apps / permissions,
  self-service signup, invitations, password reset, audit logs.
* **2FA (TOTP)** and **D1-backed rate limiting** on login / signup.
* **Your data, your edge** — everything lives in your D1 database. Clean
  Hono + JSX codebase that is easy to read and customize.

> **Status:** the Authorization Code + PKCE flow works end-to-end and the signing
> path is hardened. Full standards-conformance is still being completed — see the
> conformance notes before relying on it as your only IdP.

---

## 🔌 OIDC Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /.well-known/openid-configuration` | Discovery document |
| `GET /.well-known/jwks.json` | Public signing keys (RS256) |
| `GET /authorize` | Authorization Code flow (PKCE: S256 / plain; `prompt`, `max_age`) |
| `POST /oauth/token` | `authorization_code` + `refresh_token` grants |
| `POST /oauth/revoke` | Token revocation (RFC 7009; access or refresh token) |
| `GET\|POST /userinfo` | OIDC claims for a Bearer access_token |
| `GET\|POST /oidc/logout` | RP-initiated logout (`post_logout_redirect_uri` / `returnTo`, `id_token_hint`, `state`); also revokes the user's tokens |

`id_token` is a real RS256 JWT verifiable via JWKS; `access_token` is opaque and
resolved at `/userinfo`.

---

## 🛠️ Quick Start (local)

```bash
npm install

# 1. Create the local D1 schema
npx wrangler d1 execute tobira-mock-db --local --file ./schema.sql

# 2. Create an admin user (choose [1] Local at the prompt)
npx tsx scripts/manage-admin.ts create admin@example.com mypassword

# 3. Run
npm run dev   # -> http://localhost:8787/login
```

In local dev the signing-key encryption falls back to a fixed insecure KEK, so no
secrets are required to get started.

---

## 🚀 Production Deployment

```bash
# 1. Create a real D1 database and put its id in wrangler.toml
wrangler d1 create tobira-mock-db
wrangler d1 execute tobira-mock-db --remote --file ./schema.sql

# 2. Set secrets
wrangler secret put OIDC_KEK     # encrypts the OIDC signing keys at rest (required in prod)
# Also change JWT_SECRET in wrangler.toml [vars] to your own random value
# (it signs internal session / API tokens). Consider moving it to a secret too.

# 3. Create a remote admin (choose [2] Remote)
npx tsx scripts/manage-admin.ts create admin@example.com mypassword

# 4. Deploy
npm run deploy
```

> ⚠️ Changing `OIDC_KEK` later makes existing encrypted signing keys
> undecryptable, forcing key regeneration (all previously issued tokens stop
> verifying). Set it once before going live.

---

## 🔐 Registering a Client (Relying Party)

In the **admin UI → Apps**, add an app:

- **id** → becomes the `client_id`
- **base_url** → the registered origin (and optional path) that `redirect_uri`
  must match. The origin must match exactly; any path at or below `base_url` is
  allowed (e.g. `https://app.example.com` permits `https://app.example.com/callback`).

A new app is **confidential** by default — a `client_secret` is generated and
shown in the edit modal. For a SPA / native client, open the edit modal and click
**Make public (SPA)** to clear the secret; PKCE is then required.

Grant the user (or their group) permission to the app, or `/authorize` returns
`access_denied`.

A complete, runnable OIDC client (Cloudflare Workers, no SDK) lives in
[`examples/cf-demo`](examples/cf-demo) — it performs the Authorization Code flow
and verifies the `id_token` against this IdP's JWKS.

---

## 🔑 Signing Keys & Rotation

RS256 keys are stored in the `system_config` table (`oidc_keys` row) as an
encrypted set. Signing always uses the newest key; older public keys remain in
JWKS for an overlap window so already-issued tokens still verify, then are pruned.
See [`src/oidc/keys.ts`](src/oidc/keys.ts).

Force a manual rotation (regenerate from scratch):

```bash
npx wrangler d1 execute tobira-mock-db --local --command "DELETE FROM system_config WHERE key='oidc_keys';"
```

## License
MIT
