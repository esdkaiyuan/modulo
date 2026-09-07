# MySQL Account Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace browser-persisted accounts and account-owned data with a secure Express/MySQL backend, migrate legacy browser accounts through email verification, and deploy the verified system without losing existing data.

**Architecture:** The Vue frontend calls same-origin `/api/*` endpoints and keeps only transient authenticated state. A TypeScript Express process owns MySQL access, opaque HttpOnly sessions, email verification, activity persistence, and AES-GCM-encrypted AI configuration. A one-time migration module reads legacy localStorage/IndexedDB only after a legacy password match and deletes it only after the server confirms a complete import.

**Tech Stack:** Vue 3, Pinia, TypeScript, Express, mysql2, Zod, Node.js crypto (`scrypt`, HMAC-SHA256, AES-256-GCM), Vitest, Supertest, MariaDB/MySQL, Nginx, systemd

**Execution Constraint:** Do not create Git commits, branches, or tags unless the user explicitly authorizes them. Preserve all unrelated pre-existing working-tree changes.

---

## File Structure

### Backend Runtime

- `server/src/config.ts`: validates environment variables and parses encryption/session configuration.
- `server/src/app.ts`: composes Express middleware and mounts version-one routes without listening.
- `server/src/index.ts`: starts the HTTP server, verifies database connectivity, and shuts down cleanly.
- `server/src/errors.ts`: defines stable API error codes and response envelopes.
- `server/src/types/express.d.ts`: attaches authenticated session/user data to `Express.Request`.
- `server/src/middleware/errorHandler.ts`: redacted centralized error handling.
- `server/src/middleware/originGuard.ts`: rejects cross-origin mutations.
- `server/src/middleware/requireSession.ts`: loads the current opaque session from MySQL.
- `server/src/middleware/rateLimits.ts`: independent auth, email-code, and migration limits.

### Database and Security

- `server/migrations/001_account_backend.sql`: additive MySQL account schema.
- `server/src/db.ts`: mysql2 pool lifecycle and transaction helper.
- `server/src/migrate.ts`: migration-table bootstrap and ordered migration runner.
- `server/src/security/passwords.ts`: versioned scrypt password hashing and verification.
- `server/src/security/sessions.ts`: random session tokens and HMAC token digests.
- `server/src/security/aiEncryption.ts`: AES-256-GCM encryption/decryption with key versions.

### Backend Modules

- `server/src/integrations/emailVerification.ts`: bounded server-only email service client.
- `server/src/modules/auth/authSchemas.ts`: registration, login, password, and migration validation.
- `server/src/modules/auth/authRepository.ts`: users and sessions SQL.
- `server/src/modules/auth/authService.ts`: registration, login, session, and password transactions.
- `server/src/modules/auth/authRoutes.ts`: `/api/auth/*` routes and cookies.
- `server/src/modules/me/meRoutes.ts`: rename, password change, and account deletion.
- `server/src/modules/activity/activityRepository.ts`: isolated activity SQL and 500-row cap.
- `server/src/modules/activity/activityRoutes.ts`: `/api/me/activity` routes.
- `server/src/modules/aiConfig/aiConfigRepository.ts`: encrypted configuration SQL.
- `server/src/modules/aiConfig/aiConfigRoutes.ts`: `/api/me/ai-config` routes.
- `server/src/modules/legacy/legacyMigrationService.ts`: idempotent email-verified import transaction.
- `server/src/modules/legacy/legacyRoutes.ts`: `/api/auth/legacy/*` routes.

### Frontend Integration

- `src/user/serverApi.ts`: typed same-origin fetch wrapper with stable API errors.
- `src/user/authStore.ts`: server session state and account mutations; no browser account persistence.
- `src/user/legacyStorage.ts`: bounded legacy readers, password match, payload creation, and post-confirmation cleanup.
- `src/user/activityStore.ts`: server-backed activity loading/recording/clearing.
- `src/features/aiagent/stores/aiAgentStore.ts`: server-backed per-account AI configuration.
- `src/pages/UserAuthPage.vue`: existing login/register UI plus verified legacy migration state.
- `src/pages/UserProfilePage.vue`: asynchronous server-backed rename/password/delete actions.
- `src/App.vue`: waits for initial session restoration before protected-route decisions.
- `vite.config.ts`: proxies `/api` to the local Express process.

### Tests and Deployment

- `server/tests/helpers.ts`: reusable in-memory repository, cookie request, user, and response fixtures.
- `server/tests/*.test.ts`: Node-environment unit/API tests.
- `server/tests/mysqlIntegration.test.ts`: real isolated MariaDB integration tests.
- `src/tests/authStore.test.ts`: server-backed authentication state.
- `src/tests/userAuthPage.test.ts`: registration hints, animation, login, and migration UI.
- `src/tests/activityStore.test.ts`: server-backed activity isolation behavior.
- `src/tests/aiAgentStore.test.ts`: AI configuration load/save/logout behavior.
- `.env.example`: safe configuration names only.
- `deploy/matrix-api.service`: systemd unit template.
- `deploy/matrix-nginx-api.conf`: production `/api/` proxy snippet.
- `deploy/README.md`: backup, migration, release, rollback, and verification commands.

---

### Task 1: Add Backend Tooling and Validated Configuration

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.gitignore`
- Modify: `vite.config.ts`
- Create: `.env.example`
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/src/config.ts`
- Create: `server/tests/config.test.ts`

- [ ] **Step 1: Write the failing configuration test**

```ts
// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { parseConfig } from '../src/config';

const valid = {
  NODE_ENV: 'test',
  PORT: '4010',
  APP_ORIGIN: 'https://matrix.esdkaiyuan.online',
  DATABASE_URL: 'mysql://user:pass@127.0.0.1:3306/matrix_test',
  SESSION_SECRET: 's'.repeat(64),
  AI_CONFIG_KEY: Buffer.alloc(32, 7).toString('base64'),
  AI_CONFIG_KEY_VERSION: '1',
  EMAIL_VERIFY_BASE_URL: 'https://youxiangyanzheng.esdkaiyuan.online/api/v1',
  EMAIL_VERIFY_API_KEY: 'mail-key',
  COOKIE_SECURE: 'true'
};

describe('parseConfig', () => {
  it('requires secrets and decodes a 32-byte AI key', () => {
    expect(() => parseConfig({})).toThrow(/DATABASE_URL/);
    const config = parseConfig(valid);
    expect(config.port).toBe(4010);
    expect(config.aiConfigKey).toHaveLength(32);
    expect(config.cookieSecure).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- --run server/tests/config.test.ts`

Expected: FAIL because `server/src/config.ts` does not exist.

- [ ] **Step 3: Install backend dependencies and add scripts**

Run:

```powershell
npm install cookie-parser express express-rate-limit helmet mysql2 zod
npm install --save-dev @types/cookie-parser @types/express @types/node @types/supertest supertest tsx
```

Set the scripts in `package.json` to include:

```json
{
  "dev": "vite",
  "dev:web": "vite",
  "dev:server": "tsx watch server/src/index.ts",
  "build": "vue-tsc --noEmit && tsc -p server/tsconfig.json && vite build",
  "start:server": "node server/dist/index.js",
  "db:migrate": "node server/dist/migrate.js",
  "test": "vitest"
}
```

- [ ] **Step 4: Implement strict configuration parsing**

`parseConfig` must return this exact shape:

```ts
export interface ServerConfig {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  appOrigin: string;
  databaseUrl: string;
  sessionSecret: string;
  aiConfigKey: Buffer;
  aiConfigKeyVersion: number;
  emailVerifyBaseUrl: string;
  emailVerifyApiKey: string;
  cookieSecure: boolean;
}

export function parseConfig(env: NodeJS.ProcessEnv | Record<string, string | undefined>): ServerConfig;
export function getConfig(): ServerConfig;
```

Reject an AI key whose decoded length is not exactly 32 bytes, a session secret
shorter than 32 characters, a non-HTTP(S) origin, or a port outside 1-65535.
`.env.example` contains only variable names and safe non-secret URLs. Ignore
`.env`, `server/dist`, and server test artifacts.

Add this Vite development proxy while preserving `/mailapi` until the frontend
switch task removes it:

```ts
'/api': {
  target: 'http://127.0.0.1:4010',
  changeOrigin: false
}
```

Use this server compiler contract in `server/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts"]
}
```

Because the repository root is ESM while the compiled server is CommonJS,
create `server/package.json` with:

```json
{
  "private": true,
  "type": "commonjs"
}
```

- [ ] **Step 5: Run GREEN and type checking**

Run: `npm test -- --run server/tests/config.test.ts`

Expected: PASS with one test.

Run: `npx tsc -p server/tsconfig.json --noEmit`

Expected: exit code 0.

---

### Task 2: Add the Additive MySQL Schema and Migration Runner

**Files:**
- Create: `server/migrations/001_account_backend.sql`
- Create: `server/src/db.ts`
- Create: `server/src/migrate.ts`
- Create: `server/tests/migrations.test.ts`

- [ ] **Step 1: Write a failing schema contract test**

```ts
// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('account backend migration', () => {
  it('defines every account-owned table and isolation key', () => {
    const sql = readFileSync('server/migrations/001_account_backend.sql', 'utf8');
    for (const table of ['users', 'sessions', 'activity_events', 'ai_configs', 'legacy_imports']) {
      expect(sql).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
    }
    expect(sql).toMatch(/FOREIGN KEY \(user_id\)/g);
    expect(sql).toContain('UNIQUE KEY uq_activity_legacy');
    expect(sql).not.toMatch(/DROP\s+(TABLE|DATABASE)/i);
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- --run server/tests/migrations.test.ts`

Expected: FAIL because the SQL migration does not exist.

- [ ] **Step 3: Create the complete additive migration**

Use the following table contract in `001_account_backend.sql`:

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(100) PRIMARY KEY,
  applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  username_normalized VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  email VARCHAR(254) NOT NULL,
  email_normalized VARCHAR(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('active','disabled') NOT NULL DEFAULT 'active',
  legacy_migrated_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_users_username_normalized (username_normalized),
  UNIQUE KEY uq_users_email_normalized (email_normalized)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_agent VARCHAR(255) NULL,
  ip_address VARCHAR(64) NULL,
  expires_at DATETIME(3) NOT NULL,
  last_seen_at DATETIME(3) NOT NULL,
  revoked_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_sessions_token_hash (token_hash),
  KEY idx_sessions_user_active (user_id, revoked_at, expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  tool VARCHAR(32) NOT NULL,
  occurred_at DATETIME(3) NOT NULL,
  legacy_event_key VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_activity_legacy (user_id, legacy_event_key),
  KEY idx_activity_user_time (user_id, occurred_at, id),
  CONSTRAINT fk_activity_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ai_configs (
  user_id CHAR(36) PRIMARY KEY,
  ciphertext LONGBLOB NOT NULL,
  iv VARBINARY(12) NOT NULL,
  auth_tag VARBINARY(16) NOT NULL,
  key_version INT UNSIGNED NOT NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_ai_configs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS legacy_imports (
  id CHAR(36) PRIMARY KEY,
  legacy_source_id CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  legacy_user_id VARCHAR(100) NOT NULL,
  email_normalized VARCHAR(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  user_id CHAR(36) NOT NULL,
  activity_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_legacy_source_id (legacy_source_id),
  KEY idx_legacy_user (user_id),
  CONSTRAINT fk_legacy_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

- [ ] **Step 4: Implement pool and ordered migration execution**

`server/src/db.ts` exports:

```ts
export function createDatabase(databaseUrl: string): Pool;
export async function withTransaction<T>(pool: Pool, work: (connection: PoolConnection) => Promise<T>): Promise<T>;
```

`server/src/migrate.ts` must sort `server/migrations/*.sql`, create
`schema_migrations`, execute only absent versions in a transaction, and insert
the filename after success. Export `runMigrations(pool, migrationsDir)` and run
it from a CLI only when `require.main === module`.

- [ ] **Step 5: Run GREEN and migration parser tests**

Run: `npm test -- --run server/tests/migrations.test.ts`

Expected: PASS and no destructive SQL match.

---

### Task 3: Build Password, Session, AI Encryption, and API Foundations

**Files:**
- Create: `server/src/errors.ts`
- Create: `server/src/security/passwords.ts`
- Create: `server/src/security/sessions.ts`
- Create: `server/src/security/aiEncryption.ts`
- Create: `server/src/middleware/errorHandler.ts`
- Create: `server/src/middleware/originGuard.ts`
- Create: `server/src/middleware/rateLimits.ts`
- Create: `server/tests/security.test.ts`

- [ ] **Step 1: Write failing cryptography and error tests**

```ts
// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../src/security/passwords';
import { createSessionToken, digestSessionToken } from '../src/security/sessions';
import { decryptAiConfig, encryptAiConfig } from '../src/security/aiEncryption';

describe('security primitives', () => {
  it('hashes and verifies passwords with a versioned scrypt string', async () => {
    const hash = await hashPassword('legacy6');
    expect(hash).toMatch(/^scrypt\$/);
    expect(hash).not.toContain('legacy6');
    await expect(verifyPassword('legacy6', hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong-pass', hash)).resolves.toBe(false);
  });

  it('stores only a keyed digest of a random session token', () => {
    const token = createSessionToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(digestSessionToken(token, 's'.repeat(64))).toMatch(/^[0-9a-f]{64}$/);
  });

  it('authenticates encrypted AI configuration', () => {
    const key = Buffer.alloc(32, 5);
    const encrypted = encryptAiConfig({ apiKey: 'secret', model: 'm' }, key, 1);
    expect(decryptAiConfig(encrypted, key)).toEqual({ apiKey: 'secret', model: 'm' });
    encrypted.authTag[0] ^= 1;
    expect(() => decryptAiConfig(encrypted, key)).toThrow();
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- --run server/tests/security.test.ts`

Expected: FAIL because security modules do not exist.

- [ ] **Step 3: Implement the exact primitive contracts**

```ts
export async function hashPassword(password: string): Promise<string>;
export async function verifyPassword(password: string, encodedHash: string): Promise<boolean>;

export function createSessionToken(): string;
export function digestSessionToken(token: string, secret: string): string;

export interface EncryptedPayload {
  ciphertext: Buffer;
  iv: Buffer;
  authTag: Buffer;
  keyVersion: number;
}
export function encryptAiConfig(value: unknown, key: Buffer, keyVersion: number): EncryptedPayload;
export function decryptAiConfig<T>(payload: EncryptedPayload, key: Buffer): T;
```

Use scrypt parameters `N=16384`, `r=8`, `p=1`, a 16-byte salt, and a 32-byte
derived key. Compare derived keys with `timingSafeEqual`. Use HMAC-SHA256 for
session digests. Use `aes-256-gcm`, a fresh 12-byte IV, and a 16-byte tag.

- [ ] **Step 4: Add stable errors and transport middleware**

Define `ApiError(code, status, message, field?)`. The error handler returns only
the approved `{ error: { code, message, field? } }` shape. `originGuard` permits
GET/HEAD/OPTIONS and otherwise requires `Origin === config.appOrigin`.
Create three limiters: login `10/15min/IP`, code `5/hour/IP`, migration
`5/hour/IP`.

- [ ] **Step 5: Run GREEN**

Run: `npm test -- --run server/tests/security.test.ts`

Expected: PASS with all cryptography tests.

---

### Task 4: Implement Users, Sessions, and Email Verification Repositories

**Files:**
- Create: `server/src/integrations/emailVerification.ts`
- Create: `server/src/modules/auth/authRepository.ts`
- Create: `server/src/modules/auth/authSchemas.ts`
- Create: `server/tests/emailVerification.test.ts`

- [ ] **Step 1: Write failing email-client tests**

```ts
// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { createEmailVerificationClient } from '../src/integrations/emailVerification';

it('keeps the API key server-side and bounds calls with a timeout signal', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  }));
  const client = createEmailVerificationClient({
    baseUrl: 'https://mail.example/api/v1', apiKey: 'server-key', timeoutMs: 5000, fetchImpl: fetchMock
  });
  await client.sendCode('maker@example.com');
  expect(fetchMock).toHaveBeenCalledWith('https://mail.example/api/v1/send-code', expect.objectContaining({
    method: 'POST', headers: expect.objectContaining({ 'X-API-Key': 'server-key' }), signal: expect.any(AbortSignal)
  }));
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --run server/tests/emailVerification.test.ts`

Expected: FAIL because the integration module is absent.

- [ ] **Step 3: Implement normalized schemas and repository methods**

Export `normalizeUsername(value) = value.trim().normalize('NFKC').toLocaleLowerCase('en-US')`
and `normalizeEmail(value) = value.trim().normalize('NFKC').toLocaleLowerCase('en-US')`.
Add Zod schemas for username `2-20` Unicode characters, normalized email, new
passwords `8-128`, legacy passwords `6-128`, six-digit codes, bounded user
agent/IP, allowed tool IDs `image`, `video`, `animation`, `font`, `batch`,
`handdraw`, `audio`, `bead`, and `ai`, plus the exact AI form fields currently
defined by `AiFormSnapshot`.

`createAuthRepository(pool)` must expose:

```ts
findUserByIdentifier(identifierNormalized: string, connection?: PoolConnection): Promise<UserRow | null>;
findUserByEmail(emailNormalized: string, connection?: PoolConnection): Promise<UserRow | null>;
findUserByUsername(usernameNormalized: string, connection?: PoolConnection): Promise<UserRow | null>;
createUser(input: CreateUserInput, connection: PoolConnection): Promise<UserRow>;
updateUsername(userId: string, username: string, normalized: string): Promise<void>;
updatePassword(userId: string, passwordHash: string, connection: PoolConnection): Promise<void>;
deleteUser(userId: string, connection: PoolConnection): Promise<void>;
createSession(input: CreateSessionInput, connection: PoolConnection): Promise<SessionRow>;
findSessionByDigest(digest: string): Promise<AuthenticatedSession | null>;
touchSession(sessionId: string, lastSeenAt: Date): Promise<void>;
revokeSession(sessionId: string): Promise<void>;
revokeUserSessions(userId: string, connection: PoolConnection): Promise<void>;
```

All selects list columns explicitly and never return `password_hash` from a
public mapping function.

- [ ] **Step 4: Implement the email verification client**

Expose `sendCode(email)` and `verifyCode(email, code)`. Use one 5-second
`AbortController`, parse JSON defensively, and map timeout, 429, invalid code,
and upstream outage to stable local `ApiError` codes.

- [ ] **Step 5: Run GREEN**

Run: `npm test -- --run server/tests/emailVerification.test.ts`

Expected: PASS with no real network traffic.

---

### Task 5: Add Registration, Login, Session Restore, and Logout APIs

**Files:**
- Create: `server/src/types/express.d.ts`
- Create: `server/src/middleware/requireSession.ts`
- Create: `server/src/modules/auth/authService.ts`
- Create: `server/src/modules/auth/authRoutes.ts`
- Create: `server/src/app.ts`
- Create: `server/src/index.ts`
- Create: `server/tests/helpers.ts`
- Create: `server/tests/authApi.test.ts`

- [ ] **Step 1: Write failing API tests with an in-memory repository fake**

Create `server/tests/helpers.ts` with `createTestContext()` returning the app,
origin, mutable repository fake, mocked email client, and seeded-user helper;
`authRequest(app, cookie)` returning a Supertest agent with the cookie; and
`jsonResponse(body, status = 200)` returning a JSON `Response`. Repository fake
methods must enforce normalized username/email uniqueness and session expiry so
API tests exercise service behavior rather than unconditional mocks.

```ts
it('registers only after server-side code verification and sets an HttpOnly cookie', async () => {
  email.verifyCode.mockResolvedValue(undefined);
  const response = await request(app).post('/api/auth/register')
    .set('Origin', origin)
    .send({ username: 'maker', email: 'maker@example.com', password: 'secret123', confirm: 'secret123', code: '123456' })
    .expect(201);
  expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
  expect(response.headers['set-cookie'][0]).toContain('Secure');
  expect(response.body.user).toMatchObject({ username: 'maker', email: 'maker@example.com' });
  expect(JSON.stringify(response.body)).not.toContain('password_hash');
});

it.each(['maker', 'MAKER@EXAMPLE.COM'])('logs in with normalized identifier %s', async (identifier) => {
  await request(app).post('/api/auth/login').set('Origin', origin)
    .send({ identifier, password: 'secret123' }).expect(200);
});
```

Also test duplicate username/email, invalid code, generic invalid credentials,
disabled accounts, missing/wrong Origin, expired/revoked cookies, restore, and
logout.

- [ ] **Step 2: Run RED**

Run: `npm test -- --run server/tests/authApi.test.ts`

Expected: FAIL because the Express app and auth routes do not exist.

- [ ] **Step 3: Implement auth transactions and cookie helpers**

Registration rechecks username/email inside one transaction after code
verification, hashes the password, creates user/session, and commits before
setting `dms_sid`. Login returns one `INVALID_CREDENTIALS` response for missing,
disabled, and wrong-password accounts. Cookie options are:

```ts
{
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: 'lax',
  path: '/api',
  maxAge: 30 * 24 * 60 * 60 * 1000
}
```

- [ ] **Step 4: Compose the app and session middleware**

Middleware order: request ID, Helmet, JSON `256kb`, cookie parser, origin guard,
routes, not-found error, centralized error handler. `/api/health` performs
`SELECT 1` and returns `{ status: 'ok', database: 'ok' }` without secrets.

`requireSession` digests `dms_sid`, loads an active unexpired session/user,
attaches `req.auth = { sessionId, userId, user }`, and performs a bounded
last-seen update.

- [ ] **Step 5: Run GREEN and server build**

Run: `npm test -- --run server/tests/authApi.test.ts`

Expected: PASS.

Run: `npx tsc -p server/tsconfig.json`

Expected: compiled files under `server/dist` with exit code 0.

---

### Task 6: Add Server-Backed Profile, Password, and Account Deletion

**Files:**
- Create: `server/src/modules/me/meRoutes.ts`
- Create: `server/tests/meApi.test.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Write failing ownership and mutation tests**

```ts
it('renames only the session user and rejects a normalized collision', async () => {
  await authRequest(userACookie).patch('/api/me').set('Origin', origin)
    .send({ username: 'maker-two' }).expect(200);
  expect(await repository.findUserByUsername('maker-two')).toMatchObject({ id: userA.id });
});

it('changes the password and revokes every prior session', async () => {
  await authRequest(userACookie).patch('/api/me/password').set('Origin', origin)
    .send({ oldPassword: 'secret123', newPassword: 'changed123', confirm: 'changed123' }).expect(204);
  await authRequest(userACookie).get('/api/auth/session').expect(401);
});

it('deletes only the authenticated account with cascading owned data', async () => {
  await authRequest(userACookie).delete('/api/me').set('Origin', origin)
    .send({ password: 'secret123' }).expect(204);
  expect(await repository.findUserByEmail(userB.email)).not.toBeNull();
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --run server/tests/meApi.test.ts`

Expected: FAIL because `/api/me` routes are absent.

- [ ] **Step 3: Implement the three authenticated mutations**

Rename uses the normalized unique key and maps duplicate SQL errors to
`USERNAME_TAKEN`. Password change verifies the old password, hashes the new
password, updates it and revokes all sessions in one transaction, then clears
the cookie. Account deletion requires the password, deletes `users.id =
req.auth.userId`, relies on cascading foreign keys, and clears the cookie.

- [ ] **Step 4: Run GREEN**

Run: `npm test -- --run server/tests/meApi.test.ts server/tests/authApi.test.ts`

Expected: PASS.

---

### Task 7: Add Isolated Activity APIs

**Files:**
- Create: `server/src/modules/activity/activityRepository.ts`
- Create: `server/src/modules/activity/activityRoutes.ts`
- Create: `server/tests/activityApi.test.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Write failing user-isolation tests**

```ts
it('derives activity ownership from the session and caps rows at 500', async () => {
  await authRequest(userACookie).post('/api/me/activity').set('Origin', origin)
    .send({ tool: 'image', userId: userB.id }).expect(201);
  const a = await authRequest(userACookie).get('/api/me/activity').expect(200);
  const b = await authRequest(userBCookie).get('/api/me/activity').expect(200);
  expect(a.body.events).toHaveLength(1);
  expect(b.body.events).toHaveLength(0);
  expect(a.body.events[0]).not.toHaveProperty('userId');
});
```

Also insert 501 events and assert only the newest 500 remain, test allowed tool
IDs, chronological output, duplicate suppression, and clear-history isolation.

- [ ] **Step 2: Run RED**

Run: `npm test -- --run server/tests/activityApi.test.ts`

Expected: FAIL because activity routes do not exist.

- [ ] **Step 3: Implement repository and routes**

`POST` strips unknown request properties, uses `req.auth.userId`, assigns the
server timestamp, inserts the event, and deletes rows older than the latest 500 for that user in one
transaction. `GET` returns `{ events: Array<{ id, tool, ts }> }` oldest first.
`DELETE` deletes only `WHERE user_id = ?`.

- [ ] **Step 4: Run GREEN**

Run: `npm test -- --run server/tests/activityApi.test.ts`

Expected: PASS including the A/B isolation case.

---

### Task 8: Add Encrypted AI Configuration APIs

**Files:**
- Create: `server/src/modules/aiConfig/aiConfigRepository.ts`
- Create: `server/src/modules/aiConfig/aiConfigRoutes.ts`
- Create: `server/tests/aiConfigApi.test.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Write failing encryption and isolation tests**

```ts
it('stores encrypted config and returns it only to its owner', async () => {
  const config = { protocol: 'openai', baseUrl: 'https://api.example.com', apiKey: 'user-secret', model: 'm', deviceKind: 'display', deviceId: 'ssd1306-i2c', customDevice: '', platformId: 'esp32-arduino', extra: '', bus: 'i2c', pins: {}, i2cAddr: '0x3C', busFreq: '400000', uartBaud: '115200' };
  await authRequest(userACookie).put('/api/me/ai-config').set('Origin', origin).send(config).expect(204);
  expect(await rawAiRow(userA.id)).not.toContain('user-secret');
  expect((await authRequest(userACookie).get('/api/me/ai-config').expect(200)).body.config.apiKey).toBe('user-secret');
  expect((await authRequest(userBCookie).get('/api/me/ai-config').expect(200)).body.config).toBeNull();
});
```

Test tampered authentication tags, unknown properties, oversized strings,
delete isolation, and key-version mismatch.

- [ ] **Step 2: Run RED**

Run: `npm test -- --run server/tests/aiConfigApi.test.ts`

Expected: FAIL because AI configuration routes are absent.

- [ ] **Step 3: Implement allowlisted encrypted upsert/get/delete**

Validate the exact `AiFormSnapshot` fields and maximum lengths. Serialize the
validated object, encrypt it, and upsert by `req.auth.userId`. GET decrypts only
that row and maps authentication failure to `AI_CONFIG_CORRUPT` without
returning partial plaintext. DELETE uses the session user only.

- [ ] **Step 4: Run GREEN**

Run: `npm test -- --run server/tests/aiConfigApi.test.ts server/tests/security.test.ts`

Expected: PASS.

---

### Task 9: Add Idempotent Email-Verified Legacy Migration APIs

**Files:**
- Create: `server/src/modules/legacy/legacyMigrationService.ts`
- Create: `server/src/modules/legacy/legacyRoutes.ts`
- Create: `server/tests/legacyMigration.test.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Write failing migration transaction tests**

```ts
it('creates a server user, imports data once, and never stores the legacy hash', async () => {
  email.verifyCode.mockResolvedValue(undefined);
  const payload = legacyPayload({ email: 'maker@example.com', legacyUserId: 'u-old' });
  const first = await request(app).post('/api/auth/legacy/migrate').set('Origin', origin).send(payload).expect(201);
  const second = await request(app).post('/api/auth/legacy/migrate').set('Origin', origin).send(payload).expect(200);
  expect(first.body.imported.activityCount).toBe(payload.activity.length);
  expect(second.body.user.id).toBe(first.body.user.id);
  expect(await countLegacyImports()).toBe(1);
  expect(await countActivity(first.body.user.id)).toBe(payload.activity.length);
  expect(await searchDatabaseFor(payload.account.passHash)).toBe(false);
});
```

Add cases for existing verified email merge without password overwrite,
username collision requiring `requestedUsername`, invalid email code, duplicate
activity events, payload over 500 events, invalid tool IDs, malformed AI config,
and transaction rollback after an injected repository failure.

- [ ] **Step 2: Run RED**

Run: `npm test -- --run server/tests/legacyMigration.test.ts`

Expected: FAIL because migration routes do not exist.

- [ ] **Step 3: Implement the bounded migration schema**

The request accepts:

```ts
interface LegacyMigrationRequest {
  account: { id: string; username: string; email: string; createdAt: number };
  password: string;
  code: string;
  requestedUsername?: string;
  activity: Array<{ key: string; tool: AllowedTool; ts: number }>;
  aiConfig: AiFormSnapshot | null;
}
```

It explicitly rejects `passHash` and `salt` properties, more than 500 events,
future timestamps beyond five minutes, and payloads above the app JSON limit.

- [ ] **Step 4: Implement one idempotent transaction**

Compute `legacy_source_id = SHA-256(normalizedEmail + '\0' + legacyUserId)`.
After email verification, lock the existing import/email/username rows. Reuse
an existing import, merge into an existing same-email user without changing
its password, or create a new user with the entered legacy password. Insert
deduplicated activity, encrypt/upsert AI config, insert `legacy_imports`, create
a session, and commit before setting the cookie.

- [ ] **Step 5: Run GREEN**

Run: `npm test -- --run server/tests/legacyMigration.test.ts server/tests/authApi.test.ts`

Expected: PASS with no real email calls.

---

### Task 10: Replace Frontend Authentication Persistence with Server APIs

**Files:**
- Create: `src/user/serverApi.ts`
- Rewrite: `src/user/authStore.ts`
- Modify: `src/App.vue`
- Modify: `src/pages/UserProfilePage.vue`
- Rewrite: `src/tests/authStore.test.ts`
- Modify: `src/tests/app.test.ts`

- [ ] **Step 1: Rewrite auth-store tests to require server state**

```ts
it('restores a server session without writing account data locally', async () => {
  fetchMock.mockResolvedValueOnce(jsonResponse({ user: publicUser }));
  const auth = useAuthStore();
  await auth.restoreSession();
  expect(auth.currentUser).toEqual(publicUser);
  expect(localStorage.getItem('dms-users')).toBeNull();
  expect(localStorage.getItem('dms-session')).toBeNull();
});

it('uses cookie credentials for login and clears memory on logout', async () => {
  fetchMock.mockResolvedValueOnce(jsonResponse({ user: publicUser }));
  const auth = useAuthStore();
  await expect(auth.login('maker', 'secret123')).resolves.toBe(true);
  expect(fetchMock.mock.calls[0][1]).toMatchObject({ credentials: 'same-origin' });
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
  await auth.logout();
  expect(auth.currentUser).toBeNull();
});
```

Update app tests to await session restoration before asserting protected-route
redirects.

- [ ] **Step 2: Run RED**

Run: `npm test -- --run src/tests/authStore.test.ts src/tests/app.test.ts`

Expected: FAIL because the current store reads localStorage accounts.

- [ ] **Step 3: Implement the typed API client**

`request<T>(path, options)` always uses `credentials: 'same-origin'`, JSON
headers for JSON bodies, parses the stable error envelope, and throws
`ServerApiError { code, status, field }`. It never retries mutations
automatically.

Define the public account type once in `serverApi.ts` and reuse it from the
store:

```ts
export interface PublicUser {
  id: string;
  username: string;
  email: string;
  createdAt: number;
}
```

- [ ] **Step 4: Rewrite the auth store around server state**

Expose:

```ts
status: Ref<'restoring' | 'anonymous' | 'authenticated'>;
currentUser: Ref<PublicUser | null>;
restoreSession(): Promise<void>;
requestCode(email: string): Promise<boolean>;
register(input: RegistrationInput): Promise<boolean>;
login(identifier: string, password: string): Promise<boolean>;
logout(): Promise<void>;
renameUser(username: string): Promise<boolean>;
changePassword(oldPassword: string, newPassword: string): Promise<boolean>;
deleteAccount(password: string): Promise<boolean>;
```

Keep current localized message behavior, redirect target, avatar helpers, and
watermark binding. Remove account/session localStorage writes and IndexedDB
rehydration. `App.vue` does not redirect protected routes until `status` is no
longer `restoring`.

- [ ] **Step 5: Update profile page async actions and run GREEN**

Await rename, logout, password change, and account deletion. Add a password
field to the existing deletion confirmation dialog and require it before the
DELETE request. Run:

`npm test -- --run src/tests/authStore.test.ts src/tests/app.test.ts`

Expected: PASS.

---

### Task 11: Add the Legacy Browser Reader and Migration UI

**Files:**
- Create: `src/user/legacyStorage.ts`
- Modify: `src/user/authStore.ts`
- Modify: `src/pages/UserAuthPage.vue`
- Modify: `src/style.css`
- Rewrite: `src/tests/userAuthPage.test.ts`
- Create: `src/tests/legacyStorage.test.ts`

- [ ] **Step 1: Write failing storage-safety tests**

```ts
it('builds a bounded payload but retains legacy storage until explicit cleanup', async () => {
  seedLegacyAccountAndData();
  const match = await matchLegacyCredentials('maker', 'legacy6');
  expect(match?.payload.activity.length).toBeLessThanOrEqual(500);
  expect(localStorage.getItem('dms-users')).not.toBeNull();
  await clearMigratedLegacyData(match!.account.id);
  expect(localStorage.getItem('dms-users')).toBeNull();
  expect(localStorage.getItem('dms-session')).toBeNull();
  expect(localStorage.getItem('dms-activity')).toBeNull();
});
```

Test wrong password, corrupt JSON, IndexedDB unavailable, account-specific AI
config selection, deterministic event keys, and preservation after API failure.

- [ ] **Step 2: Run RED**

Run: `npm test -- --run src/tests/legacyStorage.test.ts src/tests/userAuthPage.test.ts`

Expected: FAIL because the migration reader/UI does not exist.

- [ ] **Step 3: Implement a bounded legacy-only module**

Reuse the old `hashPassword` algorithm only to match entered credentials. Read
`dms-users`, `dms-activity`, and IndexedDB stores; never send legacy `passHash`
or `salt`. Build up to 500 normalized events and one allowlisted AI snapshot.
Expose cleanup separately and remove only the migrated account's IndexedDB
rows before deleting empty shared keys.

- [ ] **Step 4: Add migration state and actions to authStore**

After a generic server login failure, call `matchLegacyCredentials`. If it
matches, set:

```ts
legacyMigration: Ref<null | {
  maskedEmail: string;
  needsCode: boolean;
  usernameConflict: boolean;
}>;
sendLegacyCode(): Promise<boolean>;
completeLegacyMigration(code: string, requestedUsername?: string): Promise<boolean>;
cancelLegacyMigration(): void;
```

On successful migration, fetch `/api/auth/session`, activity, and AI config;
compare identity/import counts; then call cleanup. On failure, leave storage
unchanged.

- [ ] **Step 5: Extend the existing auth page without replacing its visuals**

Keep `AuthShowcase`, canvas/timer animations, login/register tabs, and all five
field hints. Add a migration panel with masked email, six-digit code, resend
countdown, optional conflict username, cancel, progress, and stable error area.

- [ ] **Step 6: Run GREEN**

Run: `npm test -- --run src/tests/legacyStorage.test.ts src/tests/userAuthPage.test.ts src/tests/authStore.test.ts`

Expected: PASS including animation and hint tests.

---

### Task 12: Replace Activity and AI Browser Persistence with APIs

**Files:**
- Rewrite: `src/user/activityStore.ts`
- Modify: `src/features/aiagent/stores/aiAgentStore.ts`
- Rewrite: `src/tests/activityStore.test.ts`
- Create: `src/tests/aiAgentStore.test.ts`
- Modify: `src/i18n/messages.ts`
- Stop importing in runtime code: `src/user/localDb.ts`

- [ ] **Step 1: Write failing server-backed store tests**

```ts
it('loads, records, and clears activity through the current session', async () => {
  mockApi.get('/api/me/activity', { events: [{ id: 1, tool: 'image', ts: 10 }] });
  await activity.load();
  expect(activity.events).toEqual([{ tool: 'image', ts: 10 }]);
  await activity.record('font');
  expect(mockApi.lastPost).toEqual(['/api/me/activity', expect.objectContaining({ tool: 'font' })]);
  await activity.clearHistory();
  expect(activity.events).toEqual([]);
});

it('never writes account activity or AI config to browser storage', async () => {
  await aiStore.saveAccountConfig();
  expect(localStorage.getItem('dms-activity')).toBeNull();
  expect(localStorage.getItem('dms-ai-config')).toBeNull();
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --run src/tests/activityStore.test.ts src/tests/aiAgentStore.test.ts`

Expected: FAIL because both stores persist locally.

- [ ] **Step 3: Rewrite activity persistence**

Keep in-memory dedupe and display behavior. Load after authentication, post new
events, clear on logout, and surface a non-blocking localized sync warning on
failure. Remove all localStorage and IndexedDB writes.

- [ ] **Step 4: Rewrite AI configuration persistence**

Remove shared `dms-ai-config` and `localDb` access. GET on authenticated user
change, debounce PUT by 400ms, clear every sensitive field on logout, cancel
stale saves with an incrementing generation token, and expose a retryable save
error. Input code, generated output, and conversation history remain transient.

- [ ] **Step 5: Run GREEN and scan runtime persistence**

Run: `npm test -- --run src/tests/activityStore.test.ts src/tests/aiAgentStore.test.ts`

Expected: PASS.

Run:

```powershell
Get-ChildItem src -Recurse -File | Select-String -Pattern 'dms-users|dms-session|dms-activity|dms-ai-config|dbSyncUsers|dbSaveAiConfig'
```

Expected: matches only in `legacyStorage.ts` and migration-focused tests.

---

### Task 13: Run Full Isolation, Regression, Build, and Secret Checks

**Files:**
- Create: `server/tests/mysqlIntegration.test.ts`
- Modify only files identified by verified test failures.

- [ ] **Step 1: Add opt-in real MariaDB integration coverage**

The test requires `TEST_DATABASE_URL`, applies migrations, creates users A/B,
and verifies registration repository queries, sessions, activity isolation,
AI encrypted rows, migration idempotency, and cascading deletion. It skips with
an explicit message when the variable is absent and refuses URLs whose database
name does not match `^matrix_account_test_[0-9]{8}_[0-9]{6}$`.

- [ ] **Step 2: Run all backend tests**

Run: `npm test -- --run server/tests`

Expected: all backend tests PASS; real MariaDB test reports skipped locally
unless `TEST_DATABASE_URL` is intentionally provided.

- [ ] **Step 3: Run the entire project test suite**

Run: `npm test -- --run`

Expected: all existing modulo, app, auth, activity, AI, and backend tests PASS.

- [ ] **Step 4: Build production frontend and backend**

Run: `npm run build`

Expected: Vue type checking, server TypeScript compilation, and Vite production
build all exit 0.

- [ ] **Step 5: Run source and bundle secret/persistence scans**

Run:

```powershell
git diff --check
Get-ChildItem src,server,dist -Recurse -File | Select-String -Pattern 'bArfEwRQMx44tdTa|BEGIN.*PRIVATE KEY|dms-users|dms-session|dms-activity' | Where-Object { $_.Path -notmatch 'legacyStorage|tests' }
```

Expected: no whitespace errors; no credentials/private key; no runtime browser
account persistence outside the migration reader.

---

### Task 14: Add Production Service, Nginx, and Rollback Artifacts

**Files:**
- Create: `deploy/matrix-api.service`
- Create: `deploy/matrix-nginx-api.conf`
- Rewrite: `deploy/README.md`
- Modify: `.env.example`
- Create: `server/tests/deploymentArtifacts.test.ts`

- [ ] **Step 1: Write deployment artifact contract tests**

Add assertions to `server/tests/deploymentArtifacts.test.ts` that the service
runs as `www`, binds the compiled server, restarts on failure, and reads an
external environment file; the Nginx snippet proxies only `/api/` to
`127.0.0.1:4010` and contains no secret.

- [ ] **Step 2: Run RED**

Run: `npm test -- --run server/tests/deploymentArtifacts.test.ts`

Expected: FAIL because deployment artifacts do not exist.

- [ ] **Step 3: Create the systemd unit**

Use:

```ini
[Unit]
Description=Matrix Account API
After=network.target

[Service]
Type=simple
User=www
Group=www
WorkingDirectory=/www/wwwroot/matrix-api/current
EnvironmentFile=/etc/matrix-api.env
ExecStart=/usr/bin/node server/dist/index.js
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

- [ ] **Step 4: Create the Nginx API snippet and deployment guide**

The snippet uses `location ^~ /api/`, `proxy_pass http://127.0.0.1:4010`,
standard forwarded headers, `client_max_body_size 512k`, and bounded timeouts.
The guide documents exact backup, checksum, temporary test database, migration,
versioned backend release, frontend atomic switch, service health, and rollback
commands without real secrets.

- [ ] **Step 5: Run GREEN**

Run: `npm test -- --run server/tests/deploymentArtifacts.test.ts`

Expected: PASS.

---

### Task 15: Deploy Safely to the Production Server

**Server Paths:**
- Static current: `/www/wwwroot/matrix.esdkaiyuan.online`
- Backend releases: `/www/wwwroot/matrix-api/releases/<timestamp>`
- Backend current symlink: `/www/wwwroot/matrix-api/current`
- Environment: `/etc/matrix-api.env`
- systemd unit: `/etc/systemd/system/matrix-api.service`
- Nginx vhost: `/www/server/panel/vhost/nginx/matrix.esdkaiyuan.online.conf`
- Backup root: `/www/backup/matrix-account-backend-<timestamp>`

- [ ] **Step 1: Re-run local release verification immediately before upload**

Run:

```powershell
npm test -- --run
npm run build
git diff --check
```

Expected: zero test failures, build exit 0, and no diff-check errors.

- [ ] **Step 2: Create checksummed production backups**

Back up the current static root, vhost, current API release if present, systemd
unit if present, and a consistent `mysqldump --single-transaction` of the Matrix
database. Run `gzip -t` and `sha256sum -c` before any migration.

- [ ] **Step 3: Create and verify an isolated MariaDB test database**

Resolve and print the intended name `matrix_account_test_<YYYYMMDD_HHMMSS>`.
Create it with `utf8mb4`, grant only the provided application user for the test
run, set `TEST_DATABASE_URL`, and run:

`npm test -- --run server/tests/mysqlIntegration.test.ts`

Expected: PASS against real MariaDB. Before removal, resolve the database name
again and refuse deletion unless it exactly matches the required prefix regex.

- [ ] **Step 4: Apply additive production migrations**

Upload a versioned backend staging release, install locked dependencies, build,
set a temporary production environment file, and run:

`node server/dist/migrate.js`

Verify `schema_migrations`, table count, foreign keys, and zero legacy imports
before backend exposure. Re-run the database dump after schema migration.

- [ ] **Step 5: Install secrets and start the backend release**

Generate independent random session and 32-byte AI encryption keys on the
server. Write `/etc/matrix-api.env` as root with mode `600`, never print its
contents, and include the provided MySQL connection plus the existing dedicated
Matrix email-service key. Atomically point `current` to the release, install the
systemd unit, run `daemon-reload`, enable/start the service, and require:

```text
GET http://127.0.0.1:4010/api/health -> 200
{"status":"ok","database":"ok"}
```

- [ ] **Step 6: Update and validate Nginx before frontend switch**

Add the `/api/` proxy, remove the public `/mailapi/` locations and secret
include, run `/www/server/nginx/sbin/nginx -t`, then reload. Verify public
`/api/health` returns 200 and `/mailapi/security/keys` remains unavailable.

- [ ] **Step 7: Atomically deploy the frontend**

Upload `dist` to a timestamped sibling directory, verify SHA-256 hashes and the
absence of embedded secrets, copy required site metadata, set `www:www` with
directories `755` and files `644`, rename current to a timestamped rollback
directory, and rename staging to the stable site root.

- [ ] **Step 8: Run production acceptance checks**

Verify:

```text
root, JS, CSS, and SPA fallback -> 200
auth page renders login/register controls, canvas, and seven showcase dots
registration invalid-input hints change neutral -> bad -> good
invalid code/email calls return business 4xx, not 401/502
session cookie is Secure, HttpOnly, SameSite=Lax, Path=/api
anonymous protected route redirects to login
User A cannot access User B activity or AI rows in an isolated temporary API test
Nginx and systemd logs contain no new errors or secrets
```

Do not send a real verification email or alter a real user account without an
explicit test address supplied by the user.

- [ ] **Step 9: Preserve rollback state and report limitations**

Keep the static rollback directory, previous backend release, pre/post-migration
database dumps, service/vhost backups, and checksums. Roll back code/config by
switching symlinks/directories; do not drop the additive account tables because
that could delete newly registered or migrated users. Report that legacy
history can only be recovered from a browser that still contains it.
