/**
 * Local persistent database (IndexedDB) for user accounts and usage history.
 *
 * Design: the Pinia stores keep operating synchronously on localStorage (fast,
 * simple, already tested). This module mirrors every write into IndexedDB — the
 * durable, indexed, structured store — and rehydrates localStorage from it on
 * startup. So IndexedDB is the source of truth that survives a localStorage
 * clear; localStorage is a synchronous cache in front of it.
 *
 * Gracefully degrades: if IndexedDB is unavailable (old runtime, private mode,
 * jsdom in tests) every function no-ops and the app falls back to localStorage
 * only.
 */

const DB_NAME = 'dot-matrix-studio';
const DB_VERSION = 2;
const STORE_USERS = 'users';
const STORE_ACTIVITY = 'activity';
const STORE_AICONFIG = 'aiConfig';

export interface DbUser {
  id: string;
  username: string;
  email: string;
  passHash: string;
  salt: string;
  createdAt: number;
}

export interface DbActivity {
  id: string; // `${userId}:${ts}:${seq}` — unique per event
  userId: string;
  tool: string;
  ts: number;
}

/** Per-user AI-agent form settings (keyed by userId). Shape is opaque here. */
export interface DbAiConfig {
  userId: string;
  [field: string]: unknown;
}

function hasIndexedDb(): boolean {
  return typeof indexedDB !== 'undefined' && indexedDB !== null;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_USERS)) {
        const users = db.createObjectStore(STORE_USERS, { keyPath: 'id' });
        users.createIndex('username', 'username', { unique: false });
        users.createIndex('email', 'email', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_ACTIVITY)) {
        const activity = db.createObjectStore(STORE_ACTIVITY, { keyPath: 'id' });
        activity.createIndex('userId', 'userId', { unique: false });
        activity.createIndex('ts', 'ts', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_AICONFIG)) {
        db.createObjectStore(STORE_AICONFIG, { keyPath: 'userId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(db: IDBDatabase, store: string, mode: IDBTransactionMode): IDBObjectStore {
  return db.transaction(store, mode).objectStore(store);
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** True when the durable database can be used in this runtime. */
export function dbAvailable(): boolean {
  return hasIndexedDb();
}

// ── Users ────────────────────────────────────────────

export async function dbGetAllUsers(): Promise<DbUser[]> {
  if (!hasIndexedDb()) return [];
  try {
    const db = await openDb();
    return await reqToPromise(tx(db, STORE_USERS, 'readonly').getAll() as IDBRequest<DbUser[]>);
  } catch {
    return [];
  }
}

/** Replace the entire users store with the given list (mirror of localStorage). */
export async function dbSyncUsers(users: DbUser[]): Promise<void> {
  if (!hasIndexedDb()) return;
  try {
    // Vue reactive proxies are not structured-cloneable — copy to plain objects.
    const plain = users.map((u) => ({ ...u }));
    const db = await openDb();
    const store = tx(db, STORE_USERS, 'readwrite');
    await reqToPromise(store.clear());
    for (const u of plain) store.put(u);
    await txDone(store.transaction);
  } catch {
    /* best-effort mirror */
  }
}

// ── Activity ─────────────────────────────────────────

export async function dbGetActivity(userId: string): Promise<DbActivity[]> {
  if (!hasIndexedDb()) return [];
  try {
    const db = await openDb();
    const index = tx(db, STORE_ACTIVITY, 'readonly').index('userId');
    const rows = await reqToPromise(index.getAll(userId) as IDBRequest<DbActivity[]>);
    return rows.sort((a, b) => a.ts - b.ts);
  } catch {
    return [];
  }
}

/** Append one activity row. */
export async function dbAddActivity(row: DbActivity): Promise<void> {
  if (!hasIndexedDb()) return;
  try {
    const db = await openDb();
    const store = tx(db, STORE_ACTIVITY, 'readwrite');
    store.put(row);
    await txDone(store.transaction);
  } catch {
    /* best-effort */
  }
}

/** Delete every activity row for a user. */
export async function dbClearActivity(userId: string): Promise<void> {
  if (!hasIndexedDb()) return;
  try {
    const db = await openDb();
    const store = tx(db, STORE_ACTIVITY, 'readwrite');
    const index = store.index('userId');
    const keys = await reqToPromise(index.getAllKeys(userId) as IDBRequest<IDBValidKey[]>);
    for (const k of keys) store.delete(k);
    await txDone(store.transaction);
  } catch {
    /* best-effort */
  }
}

function txDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

// ── AI-agent config (per user) ───────────────────────

export async function dbGetAiConfig(userId: string): Promise<DbAiConfig | null> {
  if (!hasIndexedDb()) return null;
  try {
    const db = await openDb();
    const row = await reqToPromise(
      tx(db, STORE_AICONFIG, 'readonly').get(userId) as IDBRequest<DbAiConfig | undefined>
    );
    return row ?? null;
  } catch {
    return null;
  }
}

/** Store (replace) the AI-agent settings for a user. */
export async function dbSaveAiConfig(config: DbAiConfig): Promise<void> {
  if (!hasIndexedDb()) return;
  try {
    // Copy to a plain object — reactive proxies are not structured-cloneable.
    const plain = JSON.parse(JSON.stringify(config)) as DbAiConfig;
    const db = await openDb();
    const store = tx(db, STORE_AICONFIG, 'readwrite');
    store.put(plain);
    await txDone(store.transaction);
  } catch {
    /* best-effort */
  }
}

/** Delete a user's AI config (used when deleting the account). */
export async function dbDeleteAiConfig(userId: string): Promise<void> {
  if (!hasIndexedDb()) return;
  try {
    const db = await openDb();
    const store = tx(db, STORE_AICONFIG, 'readwrite');
    store.delete(userId);
    await txDone(store.transaction);
  } catch {
    /* best-effort */
  }
}
