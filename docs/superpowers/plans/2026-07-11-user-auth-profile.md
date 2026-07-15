# User Authentication and Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add verified registration, email-or-username login, rotating sessions, password recovery, profile/avatar management, account pages, and real homepage authentication state.

**Architecture:** Keep Vue and Express in one repository. Express owns all secrets and PostgreSQL access through Prisma; the Vue app talks only to `/api`, holds a short-lived access token in memory, and restores sessions through an HttpOnly refresh cookie.

**Tech Stack:** Vue 3, Pinia, TypeScript, Express, PostgreSQL, Prisma, Zod, Argon2id, JWT, Multer, Sharp, Vitest, Supertest

---

## File Structure

- `server/app.ts`: Express composition without opening a network port, suitable for Supertest.
- `server/index.ts`: validated startup and graceful shutdown.
- `server/config.ts`: environment parsing with no secret defaults.
- `server/db.ts`: Prisma client lifecycle.
- `server/prisma/schema.prisma`: users, pending registrations, sessions, and password resets.
- `server/modules/auth/`: registration, login, refresh, logout, and password recovery.
- `server/modules/profile/`: current profile, password changes, avatar upload, and sessions.
- `server/integrations/emailVerification.ts`: bounded external verification client.
- `server/middleware/`: auth, errors, request IDs, upload validation, and rate limiting.
- `src/features/auth/`: API client, auth store, validation, and auth forms.
- `src/features/account/`: approved account workbench and profile/security/session views.
- `src/pages/`: login, register, password recovery, and account pages.
- `src/App.vue`: hash routes and protected-route behavior.
- `src/pages/HomePage.vue`: real logged-out/restoring/logged-in account states.

### Task 1: Add Backend Tooling, Safe Configuration, and Development Commands

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.gitignore`
- Create: `.env.example`
- Modify: `vite.config.js`
- Create: `server/config.ts`
- Create: `server/tests/config.test.ts`

- [ ] **Step 1: Write the failing environment validation test**

```ts
import { describe, expect, it } from 'vitest';
import { parseConfig } from '../config';

describe('server config', () => {
  it('rejects missing secrets and accepts explicit safe configuration', () => {
    expect(() => parseConfig({})).toThrow(/DATABASE_URL/);
    const config = parseConfig({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/pixelcraft_test',
      JWT_ACCESS_SECRET: 'a'.repeat(32),
      JWT_REFRESH_SECRET: 'b'.repeat(32),
      EMAIL_VERIFY_BASE_URL: 'https://youxiangyanzheng.esdkaiyuan.online/api/v1',
      EMAIL_VERIFY_API_KEY: 'test-key',
      APP_ORIGIN: 'http://localhost:3000',
      PORT: '4000',
      UPLOAD_DIR: 'uploads'
    });
    expect(config.PORT).toBe(4000);
    expect(config.EMAIL_VERIFY_API_KEY).toBe('test-key');
  });
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --run server/tests/config.test.ts`

Expected: FAIL because the server config module does not exist.

- [ ] **Step 3: Install dependencies and add scripts**

Runtime dependencies:

```text
@prisma/client argon2 cookie-parser cors express express-rate-limit helmet
jsonwebtoken multer sharp zod
```

Development dependencies:

```text
@types/cookie-parser @types/cors @types/express @types/jsonwebtoken
@types/multer @types/supertest concurrently prisma supertest tsx
```

Add scripts:

```json
{
  "dev": "concurrently -k \"npm:dev:web\" \"npm:dev:server\"",
  "dev:web": "vite",
  "dev:server": "tsx watch server/index.ts",
  "build": "vue-tsc --noEmit && tsc -p server/tsconfig.json --noEmit && vite build",
  "start:server": "tsx server/index.ts",
  "db:generate": "prisma generate --schema server/prisma/schema.prisma",
  "db:migrate": "prisma migrate dev --schema server/prisma/schema.prisma",
  "test": "vitest"
}
```

- [ ] **Step 4: Implement validated configuration**

`parseConfig` must use one Zod object, require secrets with at least 32
characters outside controlled test fixtures, convert `PORT` to a number, and
export a lazy `getConfig()` so tests can supply explicit environments.

`.env.example` must contain only the names and safe URL/default values from the
approved design. Add `.superpowers/`, `uploads/`, and non-example `.env` files
to `.gitignore`.

Configure Vite:

```js
server: {
  port: 3000,
  proxy: {
    '/api': 'http://localhost:4000',
    '/uploads': 'http://localhost:4000'
  }
}
```

- [ ] **Step 5: Run GREEN and commit**

Run: `npm test -- --run server/tests/config.test.ts`

Expected: PASS.

```bash
git add package.json package-lock.json .gitignore .env.example vite.config.js server/config.ts server/tests/config.test.ts
git commit -m "build: add account backend tooling"
```

### Task 2: Define the PostgreSQL Account Schema

**Files:**
- Create: `server/prisma/schema.prisma`
- Create: `server/db.ts`
- Create: `server/tsconfig.json`
- Create: `server/tests/schema.test.ts`

- [ ] **Step 1: Write the failing schema contract test**

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('account schema', () => {
  it('defines users, pending registration, refresh sessions, and password resets', () => {
    const schema = readFileSync('server/prisma/schema.prisma', 'utf8');
    for (const model of ['User', 'PendingRegistration', 'RefreshSession', 'PasswordReset']) {
      expect(schema).toContain(`model ${model}`);
    }
    expect(schema).toContain('tokenVersion');
    expect(schema).toContain('emailVerifiedAt');
    expect(schema).toContain('tokenHash');
  });
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --run server/tests/schema.test.ts`

Expected: FAIL because the Prisma schema is absent.

- [ ] **Step 3: Implement the approved schema**

Use UUID IDs and persist email and username only after lower-case normalization,
with ordinary unique constraints and explicit string lengths. Add cascading
deletion from User to RefreshSession and indexes on expiry, revocation, and
user-session lookups. PasswordReset email is indexed but not a foreign key so
generic reset requests do not reveal account existence.

- [ ] **Step 4: Generate Prisma client and validate**

Run: `npm run db:generate`

Expected: Prisma client generation exits 0.

Run: `npx prisma validate --schema server/prisma/schema.prisma`

Expected: Schema is valid.

- [ ] **Step 5: Run GREEN and commit**

Run: `npm test -- --run server/tests/schema.test.ts`

Expected: PASS.

```bash
git add server/prisma/schema.prisma server/db.ts server/tsconfig.json server/tests/schema.test.ts
git commit -m "feat: define account database schema"
```

### Task 3: Build Express Error, Security, and Authentication Foundations

**Files:**
- Create: `server/app.ts`
- Create: `server/index.ts`
- Create: `server/errors.ts`
- Create: `server/middleware/errorHandler.ts`
- Create: `server/middleware/authenticate.ts`
- Create: `server/middleware/rateLimits.ts`
- Create: `server/modules/auth/tokens.ts`
- Create: `server/modules/auth/passwords.ts`
- Create: `server/tests/security.test.ts`

- [ ] **Step 1: Write failing password and token tests**

```ts
it('hashes passwords and never returns plaintext', async () => {
  const hash = await hashPassword('correct-horse-42');
  expect(hash).not.toContain('correct-horse-42');
  await expect(verifyPassword(hash, 'correct-horse-42')).resolves.toBe(true);
});

it('signs short access tokens and hashes random refresh tokens', () => {
  const access = signAccessToken({ userId: 'u1', tokenVersion: 0 }, config);
  expect(verifyAccessToken(access, config).userId).toBe('u1');
  const refresh = createRefreshToken();
  expect(refresh.plaintext).not.toBe(refresh.hash);
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --run server/tests/security.test.ts`

Expected: FAIL because password/token modules do not exist.

- [ ] **Step 3: Implement foundations**

Create typed `AppError(code, status, message, field?)`, one error handler with
the approved envelope, Argon2id helpers, 15-minute access JWT helpers, and
cryptographically random 256-bit refresh tokens stored as SHA-256 hashes.

`createApp(dependencies)` applies request IDs, Helmet, JSON size limits,
credentialed CORS restricted to `APP_ORIGIN`, cookie parsing, independent rate
limiters, `/api/health`, and the error handler. `authenticate` validates the
Bearer token and checks the current user's `tokenVersion`.

- [ ] **Step 4: Run GREEN and commit**

Run: `npm test -- --run server/tests/security.test.ts`

Expected: PASS.

```bash
git add server/app.ts server/index.ts server/errors.ts server/middleware server/modules/auth/tokens.ts server/modules/auth/passwords.ts server/tests/security.test.ts
git commit -m "feat: add secure Express account foundation"
```

### Task 4: Integrate the Email Service and Verified Registration

**Files:**
- Create: `server/integrations/emailVerification.ts`
- Create: `server/modules/auth/authSchemas.ts`
- Create: `server/modules/auth/registrationService.ts`
- Create: `server/modules/auth/authRoutes.ts`
- Create: `server/tests/emailVerification.test.ts`
- Create: `server/tests/registration.test.ts`

- [ ] **Step 1: Write failing email-client tests**

```ts
it('sends and verifies codes through the configured server-only API', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(jsonResponse({ success: true }))
    .mockResolvedValueOnce(jsonResponse({ success: true, data: { verified_email: 'maker@example.com' } }));
  const client = createEmailVerificationClient(config, fetchMock);
  await client.sendCode('maker@example.com');
  await client.verifyCode('maker@example.com', '123456');
  expect(fetchMock).toHaveBeenNthCalledWith(1, `${config.EMAIL_VERIFY_BASE_URL}/send-code`, expect.objectContaining({ method: 'POST' }));
  expect(fetchMock.mock.calls[0][1].headers['X-API-Key']).toBe(config.EMAIL_VERIFY_API_KEY);
});
```

- [ ] **Step 2: Write failing registration route tests**

```ts
it('does not create a user until email verification succeeds', async () => {
  await request(app).post('/api/auth/register/request').send(validRegistration).expect(202);
  expect(await prisma.user.count()).toBe(0);
  await request(app).post('/api/auth/register/verify').send({ email: validRegistration.email, code: '123456' }).expect(201);
  expect(await prisma.user.count()).toBe(1);
});
```

Cover duplicate active/pending identifiers, invalid six-digit code, expired
pending data, external timeout, upstream 429, and transaction rollback.

- [ ] **Step 3: Run RED**

Run: `npm test -- --run server/tests/emailVerification.test.ts server/tests/registration.test.ts`

Expected: FAIL because integration and routes are missing.

- [ ] **Step 4: Implement registration**

Normalize email and username, enforce the 10-character letter-and-number
password rule, hash before persistence, and upsert a 10-minute pending record.
Call `/send-code` after local validation. On verify, call `/verify-code`, then
use one Prisma transaction to recheck uniqueness, create User, delete pending
registration, and create the first RefreshSession.

Set the refresh cookie with a restricted `/api/auth` path and return public
user data plus the access token. Map upstream errors to stable local codes.

- [ ] **Step 5: Run GREEN and commit**

Run: `npm test -- --run server/tests/emailVerification.test.ts server/tests/registration.test.ts`

Expected: PASS with no real network calls.

```bash
git add server/integrations server/modules/auth server/tests/emailVerification.test.ts server/tests/registration.test.ts
git commit -m "feat: add verified email registration"
```

### Task 5: Implement Login, Refresh Rotation, Logout, and Session Reuse Protection

**Files:**
- Modify: `server/modules/auth/authRoutes.ts`
- Create: `server/modules/auth/sessionService.ts`
- Create: `server/tests/sessions.test.ts`

- [ ] **Step 1: Write failing session tests**

```ts
it.each(['maker@example.com', 'pixel_maker'])('logs in with %s', async (identifier) => {
  const response = await request(app).post('/api/auth/login').send({ identifier, password: validPassword }).expect(200);
  expect(response.body.accessToken).toBeTruthy();
  expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
});

it('rotates refresh tokens and rejects reuse', async () => {
  const firstCookie = await loginCookie(app);
  const refreshed = await request(app).post('/api/auth/refresh').set('Cookie', firstCookie).expect(200);
  await request(app).post('/api/auth/refresh').set('Cookie', firstCookie).expect(401);
  expect(refreshed.headers['set-cookie'][0]).not.toBe(firstCookie);
});
```

Also test disabled/unknown identifiers with generic errors, expired sessions,
logout cookie clearing, and token-version mismatch.

- [ ] **Step 2: Run RED**

Run: `npm test -- --run server/tests/sessions.test.ts`

Expected: FAIL because session routes are incomplete.

- [ ] **Step 3: Implement login and rotation**

Use one generic login error. Lock or transactionally update RefreshSession
during rotation so concurrent use cannot create two valid successors. Record
bounded user-agent/IP strings. Revoke the session on invalid hash reuse and
clear cookies on every failed refresh/logout path.

- [ ] **Step 4: Run GREEN and commit**

Run: `npm test -- --run server/tests/sessions.test.ts`

Expected: PASS.

```bash
git add server/modules/auth server/tests/sessions.test.ts
git commit -m "feat: add rotating account sessions"
```

### Task 6: Implement Password Recovery and Authenticated Password Changes

**Files:**
- Modify: `server/modules/auth/authRoutes.ts`
- Create: `server/modules/auth/passwordResetService.ts`
- Create: `server/tests/passwordReset.test.ts`

- [ ] **Step 1: Write failing recovery tests**

```ts
it('verifies email before allowing a one-time password reset', async () => {
  await request(app).post('/api/auth/forgot-password/request').send({ email }).expect(202);
  const verified = await request(app).post('/api/auth/forgot-password/verify').send({ email, code: '123456' }).expect(200);
  await request(app).post('/api/auth/forgot-password/reset').send({ resetToken: verified.body.resetToken, password: nextPassword }).expect(204);
  await request(app).post('/api/auth/forgot-password/reset').send({ resetToken: verified.body.resetToken, password: otherPassword }).expect(401);
});
```

Assert generic request responses for existing/unknown emails and verify that
reset/change increments `tokenVersion` and revokes all refresh sessions.

- [ ] **Step 2: Run RED**

Run: `npm test -- --run server/tests/passwordReset.test.ts`

Expected: FAIL because recovery is missing.

- [ ] **Step 3: Implement recovery and password change service**

Create a 15-minute random reset token only after external code verification,
persist only its hash, consume it transactionally, and reject replay. Add the
authenticated `/api/me/password` route requiring the current password.

- [ ] **Step 4: Run GREEN and commit**

Run: `npm test -- --run server/tests/passwordReset.test.ts`

Expected: PASS.

```bash
git add server/modules/auth server/tests/passwordReset.test.ts
git commit -m "feat: add verified password recovery"
```

### Task 7: Implement Profile, Avatar, and Device Session APIs

**Files:**
- Create: `server/modules/profile/profileSchemas.ts`
- Create: `server/modules/profile/profileRoutes.ts`
- Create: `server/modules/profile/avatarService.ts`
- Create: `server/tests/profile.test.ts`
- Create: `server/tests/avatar.test.ts`

- [ ] **Step 1: Write failing profile/session tests**

```ts
it('updates the current profile but not the verified email', async () => {
  const response = await authRequest(app, token).patch('/api/me').send({
    username: 'new_name', displayName: 'Pixel Maker', bio: 'Embedded display builder', website: 'https://example.com'
  }).expect(200);
  expect(response.body.user.username).toBe('new_name');
  expect(response.body.user.email).toBe(email);
});

it('lists and revokes owned sessions only', async () => {
  const sessions = await authRequest(app, token).get('/api/me/sessions').expect(200);
  await authRequest(app, token).delete(`/api/me/sessions/${sessions.body.sessions[0].id}`).expect(204);
  await authRequest(app, otherToken).delete(`/api/me/sessions/${sessions.body.sessions[0].id}`).expect(404);
});
```

- [ ] **Step 2: Write failing avatar tests**

Cover valid PNG/JPEG/WebP, spoofed MIME/file signature, excessive bytes,
excessive dimensions, randomized output names, and replacement cleanup.

- [ ] **Step 3: Run RED**

Run: `npm test -- --run server/tests/profile.test.ts server/tests/avatar.test.ts`

Expected: FAIL because profile routes are absent.

- [ ] **Step 4: Implement profile APIs**

Use Zod maximum lengths and HTTP/HTTPS-only website validation. Serve avatars
from one controlled directory. Multer uses memory storage with a strict byte
limit; Sharp validates/decode-limits and emits normalized WebP. Update the DB
before deleting an old managed avatar.

- [ ] **Step 5: Run GREEN and commit**

Run: `npm test -- --run server/tests/profile.test.ts server/tests/avatar.test.ts`

Expected: PASS.

```bash
git add server/modules/profile server/tests/profile.test.ts server/tests/avatar.test.ts
git commit -m "feat: add account profile and session APIs"
```

### Task 8: Build the Frontend API Client and Authentication Store

**Files:**
- Create: `src/features/auth/types.ts`
- Create: `src/features/auth/apiClient.ts`
- Create: `src/features/auth/authApi.ts`
- Create: `src/features/auth/authStore.ts`
- Create: `src/tests/authStore.test.ts`

- [ ] **Step 1: Write failing API/store tests**

```ts
it('restores the user through the refresh cookie without persisting tokens', async () => {
  mockFetch('/api/auth/refresh', refreshSuccess);
  const store = useAuthStore();
  await store.restoreSession();
  expect(store.user?.email).toBe('maker@example.com');
  expect(localStorage.getItem('accessToken')).toBeNull();
});

it('retries one 401 after refresh and never loops', async () => {
  const client = createApiClient(fetchSequence([unauthorized, refreshSuccess, profileSuccess]));
  await expect(client.get('/api/me')).resolves.toEqual(profileSuccessBody);
  expect(client.fetchCalls).toHaveLength(3);
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --run src/tests/authStore.test.ts`

Expected: FAIL because auth modules do not exist.

- [ ] **Step 3: Implement auth state**

`authStore` exposes `status: 'restoring' | 'anonymous' | 'authenticated'`, the
in-memory access token, current user, register request/verify, login, logout,
restore, profile update, avatar upload, password change, recovery, and session
actions. Concurrent 401 responses share one refresh promise.

- [ ] **Step 4: Run GREEN and commit**

Run: `npm test -- --run src/tests/authStore.test.ts`

Expected: PASS.

```bash
git add src/features/auth src/tests/authStore.test.ts
git commit -m "feat: add frontend authentication state"
```

### Task 9: Add Register, Login, and Password Recovery Pages

**Files:**
- Create: `src/features/auth/components/AuthShell.vue`
- Create: `src/pages/RegisterPage.vue`
- Create: `src/pages/LoginPage.vue`
- Create: `src/pages/ForgotPasswordPage.vue`
- Modify: `src/App.vue`
- Modify: `src/style.css`
- Create: `src/tests/authPages.test.ts`

- [ ] **Step 1: Write failing route and workflow tests**

```ts
it('renders registration as account, code, and completion steps', async () => {
  window.location.hash = '#/register';
  const wrapper = mountApp();
  await submitRegistration(wrapper, validForm);
  expect(wrapper.get('[data-test="registration-code-step"]').exists()).toBe(true);
  expect(wrapper.text()).toContain('60');
  await submitVerification(wrapper, '123456');
  expect(window.location.hash).toBe('#/');
});
```

Test email-or-username login, password visibility buttons, field errors,
resend countdown, external-service error codes, generic recovery responses,
reset token flow, and route return destinations.

- [ ] **Step 2: Run RED**

Run: `npm test -- --run src/tests/authPages.test.ts`

Expected: FAIL because routes/pages are missing.

- [ ] **Step 3: Implement auth pages**

Use the existing restrained white/blue visual language. Forms have fixed label
and error regions to avoid layout shift, semantic autocomplete values, keyboard
submission, icon buttons for password visibility, and no marketing hero. Do
not store password or verification code in browser storage.

Extend hash parsing with login/register/recovery routes and preserve `returnTo`
only for recognized internal hashes.

- [ ] **Step 4: Run GREEN and commit**

Run: `npm test -- --run src/tests/authPages.test.ts src/tests/app.test.ts`

Expected: PASS.

```bash
git add src/features/auth/components src/pages/LoginPage.vue src/pages/RegisterPage.vue src/pages/ForgotPasswordPage.vue src/App.vue src/style.css src/tests/authPages.test.ts src/tests/app.test.ts
git commit -m "feat: add account authentication pages"
```

### Task 10: Build the Approved Account Workbench

**Files:**
- Create: `src/features/account/components/AccountShell.vue`
- Create: `src/features/account/components/ProfilePanel.vue`
- Create: `src/features/account/components/SecurityPanel.vue`
- Create: `src/features/account/components/SessionsPanel.vue`
- Create: `src/pages/AccountPage.vue`
- Modify: `src/App.vue`
- Modify: `src/style.css`
- Create: `src/tests/accountPage.test.ts`

- [ ] **Step 1: Write failing workbench tests**

```ts
it('protects account routes and renders the approved workbench for a user', async () => {
  setAuthenticatedUser();
  window.location.hash = '#/account/profile';
  const wrapper = mountApp();
  expect(wrapper.get('[data-test="account-nav"]').text()).toContain('个人资料');
  expect(wrapper.get('[data-test="profile-form"]').exists()).toBe(true);
});
```

Test profile save, immediate auth-store update, avatar preview/upload, password
change, session current-device marker, revoke one, revoke others, loading,
empty, API error, and mobile tab navigation states.

- [ ] **Step 2: Run RED**

Run: `npm test -- --run src/tests/accountPage.test.ts`

Expected: FAIL because the workbench is absent.

- [ ] **Step 3: Implement account workbench**

Follow approved option A: compact identity/navigation column and an unframed
right content area. Use `/account/profile`, `/account/security`, and
`/account/sessions` hashes. On narrow screens convert the left navigation to a
scrollable tab row. Do not introduce administrator labels or controls.

- [ ] **Step 4: Run GREEN and commit**

Run: `npm test -- --run src/tests/accountPage.test.ts src/tests/app.test.ts`

Expected: PASS.

```bash
git add src/features/account src/pages/AccountPage.vue src/App.vue src/style.css src/tests/accountPage.test.ts src/tests/app.test.ts
git commit -m "feat: add user account workbench"
```

### Task 11: Connect Real Authentication to the Homepage

**Files:**
- Modify: `src/pages/HomePage.vue`
- Modify: `src/main.ts`
- Modify: `src/style.css`
- Modify: `src/tests/app.test.ts`

- [ ] **Step 1: Write failing homepage state tests**

```ts
it('shows login/register when anonymous and the real user menu when authenticated', async () => {
  const anonymous = mountHomeWithAuth({ status: 'anonymous', user: null });
  expect(anonymous.get('[data-test="home-login"]').exists()).toBe(true);
  expect(anonymous.get('[data-test="home-register"]').exists()).toBe(true);

  const authenticated = mountHomeWithAuth({ status: 'authenticated', user: fixtureUser });
  expect(authenticated.get('[data-test="account-trigger"]').text()).toContain(fixtureUser.username);
  expect(authenticated.text()).not.toContain('Pro Developer');
});
```

Test fixed-size restoring placeholder, Profile route, Settings route, sign out,
avatar fallback initials, uploaded avatar URL, and unchanged six tool launches.

- [ ] **Step 2: Run RED**

Run: `npm test -- --run src/tests/app.test.ts`

Expected: FAIL because homepage still uses static `accountUser`.

- [ ] **Step 3: Replace static homepage account data**

Call `restoreSession()` once during app bootstrap. Remove fake role, billing,
project, and static user identity entries from the menu. Map profile/settings
to account hashes and logout to the real store. Maintain current account-menu
outside-click behavior and responsive header dimensions.

- [ ] **Step 4: Run GREEN and commit**

Run: `npm test -- --run src/tests/app.test.ts src/tests/authStore.test.ts`

Expected: PASS, including all existing tool-page tests.

```bash
git add src/pages/HomePage.vue src/main.ts src/style.css src/tests/app.test.ts
git commit -m "feat: connect homepage account state"
```

### Task 12: Deployment, End-to-End Workflow, and Final Verification

**Files:**
- Modify: `deploy/nginx.conf`
- Modify: `deploy/README.md`
- Create: `server/tests/authFlow.test.ts`
- Modify only source/test files required by verified failures.

- [ ] **Step 1: Write the complete mocked registration flow test**

```ts
it('registers, verifies, restores, updates the profile, and logs out', async () => {
  await registerRequest(app, userInput);
  const verified = await verifyRegistration(app, userInput.email, '123456');
  const cookie = verified.headers['set-cookie'][0];
  const restored = await request(app).post('/api/auth/refresh').set('Cookie', cookie).expect(200);
  await authRequest(app, restored.body.accessToken).patch('/api/me').send({ displayName: 'Pixel Maker' }).expect(200);
  await request(app).post('/api/auth/logout').set('Cookie', restored.headers['set-cookie'][0]).expect(204);
});
```

- [ ] **Step 2: Update deployment docs and Nginx**

Proxy `/api/` to Express on port 4000, proxy or serve `/uploads/avatars/` with
safe content types and no directory listing, keep frontend asset caching, and
document PostgreSQL migration, environment injection, TLS, process supervision,
upload persistence, backup, and key rotation. Never include the real API key.

- [ ] **Step 3: Run backend checks**

Run: `npm test -- --run server/tests`

Expected: All backend tests PASS with the email integration mocked.

Run: `npx prisma validate --schema server/prisma/schema.prisma`

Expected: Schema valid.

- [ ] **Step 4: Run frontend and complete suite**

Run: `npm test -- --run`

Expected: All account and existing modulo tests PASS.

- [ ] **Step 5: Run production type/build checks**

Run: `npm run build`

Expected: Vue type checking, server TypeScript checking, and Vite build exit 0.

- [ ] **Step 6: Scan for leaked secrets and malformed changes**

Run: `git grep -n "nvapi-" -- ':!docs/superpowers/plans/*' ':!docs/superpowers/specs/*'`

Expected: No matches.

Run: `git diff --check`

Expected: No whitespace errors.

- [ ] **Step 7: Commit verified deployment changes**

```bash
git add deploy/nginx.conf deploy/README.md server/tests/authFlow.test.ts
git commit -m "docs: add account service deployment"
```

If final verification required source fixes, stage each repaired source or test
file explicitly in the same commit. Do not stage `.env`, uploaded avatars,
visual-companion files, logs, reference screenshots, or unrelated pre-existing
changes.
