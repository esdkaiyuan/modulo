# User Authentication and Profile Design

## Goal

Add a complete user account flow to Dot Matrix Studio: verified registration,
login by email or username, logout, session refresh, password recovery, profile
editing, avatar upload, password changes, and device-session management. The
existing homepage account menu must display real authentication state and link
to the account workspace.

This release has one user role. It does not include administrators, role-based
management, or an admin dashboard.

## Architecture

The repository becomes a same-repository frontend/backend application:

- The existing Vue 3 application remains under `src/`.
- A TypeScript Express application is added under `server/`.
- PostgreSQL stores accounts, pending registrations, password resets, and
  refresh sessions.
- Prisma owns the schema, migrations, and database queries.
- Vite proxies `/api` and `/uploads` to Express during development.
- Nginx serves the built frontend and proxies `/api` and controlled avatar
  access to Express in production.

The server uses Zod for request validation, Argon2id for passwords, Helmet and
rate limiting for transport protection, and short-lived JWT access tokens plus
rotating refresh tokens in HttpOnly cookies.

## External Email Verification

The backend integrates with:

```text
Base URL: https://youxiangyanzheng.esdkaiyuan.online/api/v1
POST /send-code
POST /verify-code
```

`send-code` sends a six-digit code, enforces a 60-second resend interval, and
uses a five-minute expiry. `verify-code` accepts the email and code and reports
whether verification succeeded.

The integration is server-only. Configuration is read from:

```env
EMAIL_VERIFY_BASE_URL=https://youxiangyanzheng.esdkaiyuan.online/api/v1
EMAIL_VERIFY_API_KEY=
```

The API key is never placed in frontend code, response payloads, logs, test
fixtures, documentation examples, or committed environment files. The server
may send it as `X-API-Key` when configured. Automated tests mock the external
service and never send real email.

## Data Model

### User

- `id`: UUID primary key.
- `username`: normalized, case-insensitive unique login name.
- `email`: normalized, case-insensitive unique verified address.
- `passwordHash`: Argon2id hash.
- `displayName`: optional nickname.
- `avatarPath`: optional server-managed avatar path.
- `bio`, `company`, `jobTitle`, `location`, `website`: optional profile fields.
- `emailVerifiedAt`: required for active accounts.
- `tokenVersion`: incremented when all sessions must become invalid.
- `createdAt`, `updatedAt`.

### PendingRegistration

- `id`: UUID primary key.
- `email`, `username`: normalized requested identifiers with unique pending
  constraints.
- `passwordHash`: already hashed; plaintext is never persisted.
- `expiresAt`: local pending-registration expiry.
- `createdAt`, `updatedAt`.

The verification code is owned by the external service and is not stored
locally.

### RefreshSession

- `id`: UUID primary key and public session identifier.
- `userId`: owner.
- `tokenHash`: hash of the active refresh token.
- `userAgent`, `ipAddress`: device display and security context.
- `expiresAt`, `lastUsedAt`, `revokedAt`, `createdAt`.

### PasswordReset

- `id`: UUID primary key.
- `email`: normalized account email.
- `resetTokenHash`: one-time local token issued only after email code
  verification.
- `verifiedAt`, `expiresAt`, `consumedAt`, `createdAt`.

## Authentication Flows

### Registration

1. The browser submits email, username, password, and password confirmation.
2. Express normalizes identifiers, validates password policy, and checks active
   and pending uniqueness.
3. Express hashes the password and upserts a short-lived pending registration.
4. Express calls the external `send-code` endpoint.
5. The browser displays the six-digit verification step and resend countdown.
6. The browser submits email and code to the local verify endpoint.
7. Express calls external `verify-code`.
8. On success, a database transaction rechecks uniqueness, creates the local
   user, removes the pending row, creates a refresh session, and returns the
   user plus an access token while setting the refresh cookie.
9. The browser returns to the originally requested route, or the homepage when
   no return route exists.

No local user is created before successful email verification.

### Login and Refresh

Login accepts a single `identifier` field containing either email or username.
The lookup is normalized and case-insensitive. A successful login creates one
refresh session, sets a rotating refresh cookie, and returns a 15-minute access
token plus the public user profile.

Refresh validates the cookie, session hash, expiry, revocation, and user token
version. It rotates the refresh token atomically and updates the session. Reuse
of an invalidated refresh token revokes the affected session.

Logout revokes the current session and clears the cookie. The account workspace
can revoke one named session or every session except the current session.

### Password Recovery

1. The browser requests a code for an email.
2. The local server responds generically and calls external `send-code` only
   when appropriate.
3. The browser submits the code; Express verifies it externally.
4. Express issues a short-lived, single-use local reset token.
5. The browser submits the reset token and new password.
6. Express hashes the password, increments `tokenVersion`, consumes the reset
   record, revokes every refresh session, and clears any current cookie.

Changing a password while logged in performs the same global session
revocation after checking the current password.

## API

```text
POST   /api/auth/register/request
POST   /api/auth/register/verify
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
POST   /api/auth/forgot-password/request
POST   /api/auth/forgot-password/verify
POST   /api/auth/forgot-password/reset

GET    /api/me
PATCH  /api/me
POST   /api/me/avatar
PATCH  /api/me/password
GET    /api/me/sessions
DELETE /api/me/sessions/:id
DELETE /api/me/sessions/others
```

Protected requests send the short-lived access token in the Authorization
header. The refresh token is accepted only from the HttpOnly cookie.

Errors use one stable envelope:

```json
{
  "error": {
    "code": "EMAIL_CODE_INVALID",
    "message": "The verification code is invalid or expired.",
    "field": "code"
  }
}
```

The frontend maps error codes to Chinese display copy. Server logs retain codes
and request IDs but redact passwords, verification codes, JWTs, cookies, API
keys, and authorization headers.

## Profile and Avatar

Users can edit username, display name, bio, company, job title, location, and
website. Username changes rerun normalization and uniqueness checks. Email is
displayed as verified and cannot be edited in this release; a future email
change must use a separate verification flow.

Avatar upload accepts JPEG, PNG, and WebP. Express validates the declared MIME
type and file signature, rejects oversized files and excessive dimensions,
normalizes the image, and writes a randomized filename below
`uploads/avatars`. Database rows store only the controlled relative path.
Replacing an avatar deletes the previous managed file after the database update
succeeds. User-supplied filesystem paths are never used.

## Frontend Routes and State

The existing hash router adds:

```text
#/register
#/login
#/forgot-password
#/account/profile
#/account/security
#/account/sessions
```

`authStore` owns the access token, current user, initial refresh state, and auth
actions. A shared API client attaches the access token and performs at most one
automatic refresh/retry after a 401. A failed refresh clears auth state and
redirects protected routes to login with a return route.

The registration screen has three steps: account details, six-digit email code,
and completion. It shows the resend countdown and retains only non-sensitive
form values between steps. Passwords are not stored in localStorage or
sessionStorage.

## Account Workspace

The approved layout is an account workbench. A compact left column shows the
avatar, display name, verified email, and navigation. The right content area
renders profile, security, or session management without nested cards.

- Profile: avatar, public fields, verified-email state, save state.
- Security: current password, new password, confirmation, and password rules.
- Sessions: current device marker, browser/device summary, last activity,
  revoke action, and revoke-other-sessions action.

The layout follows existing Dot Matrix Studio surfaces, borders, density, and
responsive behavior. On narrow screens the account navigation becomes a tab
row and content remains a single column.

## Homepage Integration

The existing homepage account area becomes state-driven:

- During initial refresh it renders a stable loading placeholder with fixed
  dimensions.
- Logged out users see Login and Register commands.
- Logged in users see the real avatar or deterministic initials, display name,
  and email.
- Profile and Settings open the appropriate account routes.
- Sign out calls the backend, clears state, and returns to the homepage.

Authentication must not add global chrome to tool routes or alter existing tool
state and exports.

## Security and Validation

- Passwords require at least 10 characters with letters and numbers.
- Registration, login, code send, code verify, refresh, and password reset use
  independent rate limits.
- Authentication failures use generic responses where detailed differences
  would enable account enumeration.
- Cookies use `HttpOnly`, `Secure` in production, `SameSite=Lax`, a restricted
  path, and explicit expiry.
- Refresh tokens are random, stored only as hashes, rotated on use, and revoked
  on suspicious reuse.
- External email calls have bounded timeouts and map upstream failures to local
  stable error codes without exposing upstream response internals.
- Profile strings have explicit maximum lengths. Website URLs allow only HTTP
  and HTTPS.
- Database transactions protect account creation, token rotation, password
  changes, and reset consumption.

## Configuration

`.env.example` contains names and safe defaults only:

```env
DATABASE_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
EMAIL_VERIFY_BASE_URL=https://youxiangyanzheng.esdkaiyuan.online/api/v1
EMAIL_VERIFY_API_KEY=
APP_ORIGIN=http://localhost:3000
PORT=4000
UPLOAD_DIR=uploads
NODE_ENV=development
```

Development scripts cover frontend and backend startup, Prisma generation,
migrations, seed-free database setup, unit tests, and production builds.

## Testing

Backend unit tests cover normalization, password hashing, JWT validation,
refresh rotation, profile validation, upload validation, and external-service
error mapping.

API integration tests use an isolated PostgreSQL test database and mocked email
service. They cover registration request and verification, expired/incorrect
codes, duplicate identifiers, email-or-username login, refresh rotation,
logout, password recovery, password changes, profile updates, avatar rejection,
and session revocation.

Frontend tests cover all auth forms, registration steps, resend countdown,
initial refresh restoration, one-time 401 retry, account workbench navigation,
profile saves, avatar uploads, password changes, sessions, and homepage logged
in/logged out states.

End-to-end coverage verifies registration through a mocked verification
service, automatic login, homepage identity rendering, account navigation, and
logout. Existing modulo engine, store, and page tests remain green.

## Acceptance Criteria

- A local account cannot exist until the email code succeeds.
- Users can log in with either normalized email or username.
- Access refresh, logout, device revocation, and session rotation work without
  storing refresh tokens in browser-readable storage.
- Password reset and password change revoke old sessions.
- Profile and avatar changes persist and immediately update the homepage.
- The homepage exposes correct logged-in, logged-out, and restoring states.
- Secrets are absent from client bundles, source control, logs, and test output.
- Account pages are responsive and visually consistent with the homepage.
- Backend tests, frontend tests, end-to-end tests, type checking, and production
  builds pass.
