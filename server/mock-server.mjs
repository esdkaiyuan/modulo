// Lightweight mock backend for the Dot Matrix Studio account API.
// Implements the /api contract consumed by src/user/authStore.ts and friends
// using a local JSON file (server/mock-data.json). This is NOT the production
// Express+MySQL backend described in
// docs/superpowers/specs/2026-07-26-mysql-account-backend-design.md - it
// exists only so the frontend can be exercised locally.
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3100;
const HOST = '127.0.0.1';
const DATA_FILE = path.join(__dirname, 'mock-data.json');
const COOKIE = 'dms_session';
const MAX_AGE = 30 * 24 * 60 * 60;
const ALLOWED_TOOLS = new Set(['image', 'video', 'animation', 'font', 'batch', 'handdraw', 'audio', 'bead', 'ai']);

let db = { users: [], sessions: {}, activities: {}, aiConfigs: {}, files: {} };
try { db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch {}

function save() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const N = 16384, r = 8, p = 1, keylen = 32;
  const hash = crypto.scryptSync(password, salt, keylen, { N, r, p, maxmem: 64 * 1024 * 1024 });
  return `scrypt:${N}:${r}:${p}:${salt.toString('hex')}:${hash.toString('hex')}`;
}

function verifyPassword(password, stored) {
  const parts = String(stored).split(':');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, Ns, rs, ps, saltHex, hashHex] = parts;
  const salt = Buffer.from(saltHex, 'hex');
  const hash = Buffer.from(hashHex, 'hex');
  const computed = crypto.scryptSync(password, salt, hash.length, { N: +Ns, r: +rs, p: +ps, maxmem: 64 * 1024 * 1024 });
  return computed.length === hash.length && crypto.timingSafeEqual(computed, hash);
}

const norm = (s) => String(s ?? '').trim().toLowerCase();
const publicUser = (u) => ({ id: u.id, username: u.username, email: u.email, bio: u.bio ?? null, createdAt: u.createdAt });

function setCookie(res, value) {
  const attrs = value === null
    ? `${COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
    : `${COOKIE}=${value}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax; HttpOnly`;
  res.setHeader('Set-Cookie', attrs);
}

function getCookie(req) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === COOKIE) return v.join('=');
  }
  return null;
}

function authUser(req) {
  const t = getCookie(req);
  const uid = t && db.sessions[t];
  return uid ? db.users.find((u) => u.id === uid) : null;
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

function sendNoContent(res) {
  res.writeHead(204);
  res.end();
}

function errorJson(res, status, code, message, field) {
  const error = { code, message };
  if (field) error.field = field;
  sendJson(res, status, { error });
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const p = url.pathname;
  const m = req.method;
  try {
    if (p === '/api/health' && m === 'GET') return sendJson(res, 200, { ok: true });

    if (p === '/api/auth/session' && m === 'GET') {
      const u = authUser(req);
      return u ? sendJson(res, 200, { user: publicUser(u) }) : errorJson(res, 401, 'NO_SESSION', 'Not authenticated');
    }
    if (p === '/api/auth/send-code' && m === 'POST') return sendNoContent(res);
    if (p === '/api/auth/register' && m === 'POST') {
      const b = await readBody(req);
      const username = String(b.username ?? '').trim();
      const email = String(b.email ?? '').trim();
      const code = String(b.code ?? '').trim();
      if ([...username].length < 2 || [...username].length > 20) return errorJson(res, 400, 'INVALID_INPUT', 'Bad username', 'username');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return errorJson(res, 400, 'INVALID_INPUT', 'Bad email', 'email');
      if (!b.password || String(b.password).length < 8) return errorJson(res, 400, 'INVALID_INPUT', 'Bad password', 'password');
      if (!/^\d{6}$/.test(code)) return errorJson(res, 400, 'INVALID_VERIFICATION_CODE', 'Invalid code', 'code');
      if (db.users.some((u) => u.usernameNormalized === norm(username))) return errorJson(res, 409, 'USERNAME_TAKEN', 'Username taken', 'username');
      if (db.users.some((u) => u.emailNormalized === norm(email))) return errorJson(res, 409, 'EMAIL_TAKEN', 'Email taken', 'email');
      const u = { id: crypto.randomUUID(), username, usernameNormalized: norm(username), email, emailNormalized: norm(email), passwordHash: hashPassword(b.password), bio: null, createdAt: Date.now() };
      db.users.push(u);
      const t = crypto.randomBytes(32).toString('hex');
      db.sessions[t] = u.id;
      save();
      setCookie(res, t);
      return sendJson(res, 200, { user: publicUser(u) });
    }
    if (p === '/api/auth/login' && m === 'POST') {
      const b = await readBody(req);
      const id = norm(b.identifier);
      const u = db.users.find((x) => x.usernameNormalized === id || x.emailNormalized === id);
      if (!u || !verifyPassword(String(b.password ?? ''), u.passwordHash)) return errorJson(res, 401, 'INVALID_CREDENTIALS', 'Invalid credentials');
      const t = crypto.randomBytes(32).toString('hex');
      db.sessions[t] = u.id;
      save();
      setCookie(res, t);
      return sendJson(res, 200, { user: publicUser(u) });
    }
    if (p === '/api/auth/logout' && m === 'POST') {
      const t = getCookie(req);
      if (t) { delete db.sessions[t]; save(); }
      setCookie(res, null);
      return sendNoContent(res);
    }
    if (p === '/api/auth/legacy/send-code' && m === 'POST') return sendNoContent(res);
    if (p === '/api/auth/legacy/migrate' && m === 'POST') {
      return errorJson(res, 400, 'INVALID_INPUT', 'Legacy migration not supported by mock backend');
    }

    if (p.startsWith('/api/me')) {
      const me = authUser(req);
      if (!me) return errorJson(res, 401, 'NO_SESSION', 'Not authenticated');

      if (p === '/api/me' && m === 'PATCH') {
        const b = await readBody(req);
        const username = String(b.username ?? '').trim();
        if ([...username].length < 2 || [...username].length > 20) return errorJson(res, 400, 'INVALID_INPUT', 'Bad username', 'username');
        if (db.users.some((u) => u.id !== me.id && u.usernameNormalized === norm(username))) return errorJson(res, 409, 'USERNAME_TAKEN', 'Username taken', 'username');
        me.username = username;
        me.usernameNormalized = norm(username);
        save();
        return sendJson(res, 200, { user: publicUser(me) });
      }
      if (p === '/api/me' && m === 'DELETE') {
        const b = await readBody(req);
        if (!verifyPassword(String(b.password ?? ''), me.passwordHash)) return errorJson(res, 401, 'INVALID_CREDENTIALS', 'Invalid credentials');
        db.users = db.users.filter((u) => u.id !== me.id);
        delete db.activities[me.id];
        delete db.aiConfigs[me.id];
        delete db.files[me.id];
        for (const [t, uid] of Object.entries(db.sessions)) if (uid === me.id) delete db.sessions[t];
        save();
        setCookie(res, null);
        return sendNoContent(res);
      }
      if (p === '/api/me/bio' && m === 'PATCH') {
        const b = await readBody(req);
        me.bio = b.bio === null || b.bio === undefined ? null : String(b.bio);
        save();
        return sendJson(res, 200, { user: publicUser(me) });
      }
      if (p === '/api/me/password' && m === 'PATCH') {
        const b = await readBody(req);
        if (!verifyPassword(String(b.oldPassword ?? ''), me.passwordHash)) return errorJson(res, 401, 'INVALID_CREDENTIALS', 'Invalid old password', 'oldPassword');
        if (!b.newPassword || String(b.newPassword).length < 8) return errorJson(res, 400, 'INVALID_INPUT', 'Bad password', 'newPassword');
        me.passwordHash = hashPassword(b.newPassword);
        const cur = getCookie(req);
        for (const [t, uid] of Object.entries(db.sessions)) if (uid === me.id && t !== cur) delete db.sessions[t];
        save();
        return sendNoContent(res);
      }
      if (p === '/api/me/activity' && m === 'GET') return sendJson(res, 200, { events: db.activities[me.id] || [] });
      if (p === '/api/me/activity' && m === 'POST') {
        const b = await readBody(req);
        if (!ALLOWED_TOOLS.has(b.tool)) return errorJson(res, 400, 'INVALID_INPUT', 'Bad tool', 'tool');
        const ev = { id: crypto.randomUUID(), tool: b.tool, ts: Date.now() };
        const list = (db.activities[me.id] ||= []);
        list.push(ev);
        if (list.length > 500) db.activities[me.id] = list.slice(-500);
        save();
        return sendJson(res, 200, { event: ev });
      }
      if (p === '/api/me/activity' && m === 'DELETE') { db.activities[me.id] = []; save(); return sendNoContent(res); }
      if (p === '/api/me/ai-config' && m === 'GET') return sendJson(res, 200, { config: db.aiConfigs[me.id] ?? null });
      if (p === '/api/me/ai-config' && m === 'PUT') {
        const b = await readBody(req);
        db.aiConfigs[me.id] = b;
        save();
        return sendNoContent(res);
      }
      if (p === '/api/me/files' && m === 'GET') return sendJson(res, 200, { records: db.files[me.id] || [] });
      if (p === '/api/me/files' && m === 'POST') {
        const b = await readBody(req);
        const r = { id: crypto.randomUUID(), tool: String(b.tool ?? ''), fileName: String(b.fileName ?? ''), fileSize: b.fileSize ?? null, meta: b.meta ?? null, createdAt: Date.now() };
        (db.files[me.id] ||= []).push(r);
        save();
        return sendJson(res, 200, { record: r });
      }
      if (p === '/api/me/files' && m === 'DELETE') { db.files[me.id] = []; save(); return sendNoContent(res); }
    }

    return errorJson(res, 404, 'NOT_FOUND', `Not found: ${m} ${p}`);
  } catch (err) {
    console.error('[mock-backend] error', err);
    return errorJson(res, 500, 'INTERNAL', 'Internal error');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[mock-backend] listening on http://${HOST}:${PORT}`);
  console.log('[mock-backend] registration accepts any 6-digit code, e.g. 123456');
});
