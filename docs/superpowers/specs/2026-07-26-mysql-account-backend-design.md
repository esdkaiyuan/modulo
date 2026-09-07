# MySQL Account Backend and Legacy Migration Design

## Goal

Replace the browser-only account implementation with a real server-side account
system. MySQL becomes the sole persistent source for accounts, sessions, tool
activity, and per-account AI configuration. Existing browser accounts remain
recoverable through a one-time, email-verified migration.

The existing login and registration visual design, showcase animation, and
field hints remain in place. This project does not add administrator roles,
billing, social login, avatar uploads, or password recovery.

## Current State

The deployed Vue application currently stores:

- Accounts and password hashes in `localStorage` under `dms-users`.
- The active account ID in `localStorage` under `dms-session`.
- Account, activity, and AI configuration mirrors in IndexedDB.
- Activity history in `localStorage` under `dms-activity`.
- Shared non-secret AI defaults in `localStorage` under `dms-ai-config`.

The Matrix MySQL database currently has no application tables. The frontend
does not call an account backend, so accounts cannot follow users across
devices and the server cannot enforce user isolation.

## Architecture

The repository becomes a same-repository frontend/backend application:

- The Vue 3 frontend remains under `src/`.
- A TypeScript Express service is added under `server/`.
- `mysql2` provides parameterized queries and explicit transactions.
- Versioned SQL migrations live under `server/migrations/`.
- Nginx serves the frontend and proxies `/api/` to Express.
- Express listens only on `127.0.0.1` and runs under a dedicated `systemd`
  service account.

The frontend never connects to MySQL. Every account-owned query derives the
user ID from the authenticated server session, never from a user ID supplied
by the browser.

MySQL is the only durable account data source after migration. The browser may
retain non-account UI preferences such as language. Decrypted AI configuration
may exist in memory while an authenticated page is open, but it is never
written to localStorage or IndexedDB.

## Security Model

### Passwords

- New registrations and password changes require at least eight characters.
- Legacy migration accepts an existing six-character-or-longer password so old
  accounts are not locked out.
- Express hashes passwords with Node.js `scrypt`, a random per-password salt,
  and explicit cost parameters stored with the hash.
- Plaintext passwords are never persisted or logged.

### Sessions

- Login creates a cryptographically random opaque session token.
- MySQL stores only its SHA-256 hash.
- The browser receives only a `Secure`, `HttpOnly`, `SameSite=Lax` cookie.
- Sessions expire after 30 days and use rolling last-seen updates.
- Logout and password changes revoke affected sessions.
- Mutating endpoints validate the same-origin `Origin` header in addition to
  the cookie policy.

### AI Configuration

- Each AI configuration is serialized through a strict allowlist.
- The payload is encrypted with AES-256-GCM before it reaches MySQL.
- Each write uses a unique 96-bit IV and stores the authentication tag.
- A key version is stored with each row to support future rotation.
- The encryption master key exists only in a production environment file with
  mode `600`; it is never committed, bundled, returned by an API, or logged.

### API Protection

- Express applies request-size limits, schema validation, security headers,
  independent authentication/code/migration rate limits, and generic login
  failures.
- SQL uses parameterized queries only.
- Passwords, cookies, email codes, AI API keys, database credentials, and
  encryption keys are redacted from logs.
- Email verification is called only by Express with a server-held API key.
  The public frontend no longer calls the verification service directly.

## MySQL Schema

All tables use InnoDB, `utf8mb4`, UTC `DATETIME(3)` timestamps, foreign keys,
and indexes for their primary access paths.

### `schema_migrations`

- `version`: migration identifier primary key.
- `applied_at`: successful application timestamp.

Migrations are append-only and idempotently recorded. Production startup does
not silently modify schema; deployment runs migrations as an explicit step.

### `users`

- `id`: UUID primary key.
- `username`: display/login name.
- `username_normalized`: lower-cased unique login key.
- `email`: verified address.
- `email_normalized`: lower-cased unique login key.
- `password_hash`: versioned scrypt string containing salt and parameters.
- `status`: `active` or `disabled`.
- `created_at`, `updated_at`.
- `legacy_migrated_at`: nullable migration timestamp.

Normalized columns use binary comparison so uniqueness does not depend on
server collation behavior.

### `sessions`

- `id`: UUID primary key.
- `user_id`: owner, cascading on account deletion.
- `token_hash`: unique SHA-256 digest.
- `user_agent`, `ip_address`: bounded diagnostic values.
- `expires_at`, `last_seen_at`, `revoked_at`, `created_at`.

### `activity_events`

- `id`: unsigned auto-increment primary key.
- `user_id`: owner, cascading on account deletion.
- `tool`: validated tool identifier.
- `occurred_at`: event timestamp.
- `legacy_event_key`: nullable deterministic import key.
- `created_at`.

`(user_id, legacy_event_key)` is unique for non-null import keys so migration
retries cannot duplicate events. The existing 500-event-per-user behavior is
preserved by pruning older rows transactionally after inserts.

### `ai_configs`

- `user_id`: primary key and cascading foreign key.
- `ciphertext`: encrypted allowlisted JSON.
- `iv`: AES-GCM IV.
- `auth_tag`: AES-GCM authentication tag.
- `key_version`: encryption key version.
- `updated_at`.

### `legacy_imports`

- `id`: UUID primary key.
- `legacy_source_id`: deterministic unique source identifier.
- `legacy_user_id`: original browser account ID.
- `email_normalized`: verified migration email.
- `user_id`: resulting server account.
- `activity_count`: imported event count.
- `created_at`.

This table makes the entire migration idempotent and provides a non-sensitive
audit record without storing legacy password hashes.

## API Contract

All JSON errors use one envelope:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "登录信息不正确",
    "field": "identifier"
  }
}
```

The initial API surface is:

```text
GET    /api/health

POST   /api/auth/send-code
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/session
POST   /api/auth/logout
POST   /api/auth/legacy/send-code
POST   /api/auth/legacy/migrate

PATCH  /api/me
PATCH  /api/me/password
DELETE /api/me

GET    /api/me/activity
POST   /api/me/activity
DELETE /api/me/activity

GET    /api/me/ai-config
PUT    /api/me/ai-config
DELETE /api/me/ai-config
```

Responses expose only public account fields. Password hashes, session hashes,
encrypted payload details, and migration internals are never returned.

## Registration and Login

### New Registration

1. The frontend validates username, email, password, confirmation, and code
   shape while retaining the current live field hints.
2. `/api/auth/send-code` validates normalized uniqueness and asks the external
   verification service to send a code.
3. `/api/auth/register` validates again, verifies the code server-side, hashes
   the password, and creates the user and first session in one transaction.
4. The response sets the session cookie and returns the public user.
5. The frontend redirects to the original protected destination or profile.

No local account is created before or after registration.

### Login and Session Restore

- Login accepts username or email through one identifier field.
- Successful login creates a new server session and cookie.
- Application startup calls `/api/auth/session` to restore the current user.
- Failed or expired sessions clear the cookie and render the anonymous state.
- No access or refresh token is written to browser-readable storage.

## Legacy Account Migration

Migration is initiated only when a server login reports no account and the
browser contains a matching legacy account whose entered password validates
against its old local hash.

1. The frontend shows a one-time migration explanation and sends a code to the
   legacy account email through `/api/auth/legacy/send-code`.
2. The user enters the email code.
3. The frontend collects the matched legacy account, up to 500 activity events,
   and the account's allowlisted AI configuration from localStorage/IndexedDB.
4. `/api/auth/legacy/migrate` verifies the code, validates and bounds the
   payload, then executes one MySQL transaction.
5. If the verified email is new, the transaction creates a server user using
   the entered legacy password rehashed with scrypt.
6. If the verified email already belongs to a server user, the transaction
   imports data into that user without overwriting the existing password.
7. If the requested username belongs to another email, the API requests a new
   username before continuing.
8. Activity is deduplicated, AI configuration is encrypted, a migration record
   and session are created, and the transaction commits.
9. The frontend fetches the server account, activity, and AI configuration and
   compares counts/identity with the migration response.
10. Only after successful verification does it remove `dms-users`,
    `dms-session`, `dms-activity`, and the account/activity/AI IndexedDB rows.

Any validation, email, database, or network failure leaves the browser data
untouched for retry. Users without the original browser can prove email
ownership and recreate an account, but browser-only history from another
device cannot be recovered because it never existed on the server.

## Account-Owned Data Flows

### Activity

- Login/session restore loads the latest 500 events from MySQL.
- A tool visit is posted asynchronously to the server after the current
  duplicate-suppression rule runs.
- UI state may hold fetched events in memory, but it is not persisted locally.
- Clear history deletes only rows belonging to the session user.

### AI Configuration

- Login to the AI page fetches and decrypts only the current user's row.
- Saves replace the encrypted row through a debounced `PUT` request.
- Logout clears the in-memory API key and form immediately.
- Account deletion cascades activity, AI configuration, sessions, and migration
  ownership records according to the defined foreign-key behavior.

## Frontend Changes

- Replace browser-backed `authStore` actions with `/api/auth/*` calls.
- Replace `activityStore` persistence with `/api/me/activity` calls.
- Replace IndexedDB AI persistence with `/api/me/ai-config` calls.
- Keep local legacy readers only inside a bounded migration module.
- After confirmed migration, delete legacy account-owned storage.
- Keep `AuthShowcase`, its timer/canvas animations, login/register tabs, and
  live registration hints.
- Add a migration state to the existing auth page: explanation, masked email,
  code field, resend countdown, username-conflict field, progress, and retry.
- Disable destructive actions while their server request is pending and show
  stable localized API error messages.

## Error Handling

- Duplicate username/email conflicts return stable field-specific codes.
- Login always uses one generic credentials error.
- Email-service timeout, rate limit, and invalid/expired code map to local error
  codes without exposing upstream internals.
- Database transactions roll back on any partial registration or migration
  failure.
- Activity recording failures surface a non-blocking retry state; authentication
  and account mutations surface blocking errors.
- AI configuration decryption/authentication failure does not return partial
  plaintext and is logged only with user/request IDs.

## Testing

### Backend Unit and API Tests

- Input normalization and validation.
- Scrypt hashing and verification.
- Session creation, restoration, expiry, revocation, and cookie attributes.
- Registration and email-service error mapping with mocked network calls.
- Login by normalized username and email.
- Profile rename, password change, logout, and account deletion.
- AI configuration encryption, authentication failure, and key versioning.
- Activity cap, deduplication, and clear-history behavior.
- Legacy migration success, retry idempotency, username conflict, existing-email
  merge, oversized payload rejection, and rollback.
- User A cannot read, mutate, or delete any User B data.

### Frontend Tests

- Session restore without browser account/token storage.
- Registration validation, hints, code sending, API errors, and automatic login.
- Existing login and legacy migration states.
- Legacy data is retained on failure and cleared only after verified import.
- Auth showcase slide timer and canvas lifecycle remain functional.
- Activity and AI configuration load/save through APIs and clear on logout.

### Real MariaDB Integration

Deployment creates a temporary isolated database on the server, applies the
same migrations, and runs real `mysql2` integration tests. The temporary
database is removed only after its absolute name is verified to match the
deployment-specific prefix. Production credentials are not printed.

## Deployment and Rollback

1. Run all frontend/backend tests and the production build locally.
2. Back up the production MySQL database, frontend root, backend release,
   Nginx vhost, and service definition; generate checksums.
3. Run migrations and integration tests against the temporary database.
4. Upload the backend into a versioned release directory and create a mode-600
   environment file containing database, session, email-service, and AI
   encryption secrets.
5. Start the backend on `127.0.0.1`, verify `/api/health`, database connectivity,
   and migration version.
6. Add the Nginx `/api/` proxy and remove direct public mail-service proxying.
7. Upload the frontend into a staging directory and atomically switch the site
   root while retaining the previous directory.
8. Verify static assets, SPA fallback, login/register rendering, cookies,
   registration validation without sending real mail, authorization boundaries,
   activity, AI configuration, and logs.

Database migrations in this release only add tables and indexes. Rollback
restores the previous frontend/backend/Nginx versions while retaining the new
tables, because dropping tables would risk losing accounts migrated after
deployment. The database backup remains the disaster-recovery copy rather than
an automatic rollback action.

## Acceptance Criteria

- MySQL is the sole persistent source for accounts, sessions, activity, and AI
  configuration after registration or migration.
- Browser account storage is absent for new users and removed only after a
  verified legacy migration.
- Existing same-browser users can migrate through one email verification and
  keep their available account data.
- Passwords and session tokens are never stored in plaintext.
- AI API keys are encrypted at rest and absent from browser storage, source
  control, logs, and bundles.
- Account-owned queries cannot accept or act on another browser-supplied user
  ID.
- Registration/login animations and field hints retain their behavior.
- All unit, API, frontend, build, real MariaDB integration, deployment health,
  and user-isolation checks pass before completion is reported.
