import { hashPassword } from './passwordHash';

const DB_NAME = 'dot-matrix-studio';
const STORE_USERS = 'users';
const STORE_ACTIVITY = 'activity';
const STORE_AI_CONFIG = 'aiConfig';
const USERS_KEY = 'dms-users';
const SESSION_KEY = 'dms-session';
const ACTIVITY_KEY = 'dms-activity';
const ACTIVITY_CAP = 500;
const LOCAL_ACTIVITY_READ_CAP = 1_000;
const ACTIVITY_CURSOR_SCAN_CAP = 2_000;
const ACCOUNT_CAP = 100;
const USERS_RAW_CAP = 256 * 1024;
const ACTIVITY_RAW_CAP = 1024 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F-\u009F]/u;
const ALLOWED_TOOLS = new Set([
  'image', 'video', 'animation', 'font', 'batch', 'handdraw', 'audio', 'bead', 'ai'
]);
const AI_PROTOCOLS = new Set(['openai', 'anthropic']);
const DEVICE_KINDS = new Set(['display', 'audio']);
const BUS_PROTOCOLS = new Set(['i2c', 'spi', 'i2s', 'pwm', 'dac', 'onewire', 'uart']);

interface StoredLegacyAccount {
  id: string;
  username: string;
  email: string;
  passHash: string;
  salt: string;
  createdAt: number;
}

interface StoredActivity {
  id: IDBValidKey;
  userId: string;
  tool: string;
  ts: number;
}

interface StoredAiConfig {
  userId: string;
  [field: string]: unknown;
}

interface IndexedActivityCleanup {
  primaryKey: IDBValidKey;
  userId: string;
  tool: string;
  ts: number;
}

interface CapturedActivity {
  event: LegacyActivityEvent;
  local: boolean;
  indexed: IndexedActivityCleanup[];
}

export interface LegacyAccount {
  id: string;
  username: string;
  email: string;
  createdAt: number;
}

export interface LegacyActivityEvent {
  key: string;
  tool: string;
  ts: number;
}

export interface LegacyAiConfig {
  protocol: 'openai' | 'anthropic';
  baseUrl: string;
  apiKey: string;
  model: string;
  deviceKind: 'display' | 'audio';
  deviceId: string;
  customDevice: string;
  platformId: string;
  extra: string;
  bus: 'i2c' | 'spi' | 'i2s' | 'pwm' | 'dac' | 'onewire' | 'uart';
  pins: Record<string, string>;
  i2cAddr: string;
  busFreq: string;
  uartBaud: string;
}

export interface LegacyCleanupSnapshot {
  accountId: string;
  accountFingerprint: string;
  localActivityKeys: string[];
  indexedActivity: IndexedActivityCleanup[];
  aiConfig: LegacyAiConfig | null;
}

export interface LegacyCredentialMatch {
  account: LegacyAccount;
  activity: LegacyActivityEvent[];
  aiConfig: LegacyAiConfig | null;
  cleanup: LegacyCleanupSnapshot;
}

interface LocalCleanupPlan {
  users: string | null | undefined;
  activity: string | null | undefined;
  removeSession: boolean;
}

function readBoundedJson(key: string, cap: number): unknown {
  let raw: string | null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return null;
  }
  if (raw === null || raw.length > cap) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readRequiredBoundedJson(key: string, cap: number): { exists: boolean; value: unknown } {
  const raw = localStorage.getItem(key);
  if (raw === null) return { exists: false, value: null };
  if (raw.length > cap) throw new Error('Legacy storage changed beyond cleanup bounds');
  try {
    return { exists: true, value: JSON.parse(raw) };
  } catch {
    throw new Error('Legacy storage changed before cleanup');
  }
}

function normalizedIdentity(value: string): string {
  return value.trim().normalize('NFKC').toLocaleLowerCase('en-US');
}

function validLegacyAccount(value: unknown): value is StoredLegacyAccount {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const account = value as Record<string, unknown>;
  if (
    typeof account.id !== 'string'
    || account.id.length < 1
    || account.id.length > 100
    || CONTROL_CHARACTERS.test(account.id)
  ) return false;
  if (typeof account.username !== 'string' || account.username.length > 256) return false;
  const username = account.username.trim().normalize('NFKC');
  const usernameLength = [...normalizedIdentity(username)].length;
  if (usernameLength < 2 || usernameLength > 20) return false;
  if (typeof account.email !== 'string' || account.email.length > 512) return false;
  const email = normalizedIdentity(account.email);
  if (email.length > 254 || !EMAIL_RE.test(email) || CONTROL_CHARACTERS.test(email)) return false;
  if (
    typeof account.createdAt !== 'number'
    || !Number.isSafeInteger(account.createdAt)
    || account.createdAt < 0
    || account.createdAt > Date.now() + 5 * 60_000
  ) return false;
  return typeof account.passHash === 'string'
    && account.passHash.length > 0
    && account.passHash.length <= 256
    && typeof account.salt === 'string'
    && account.salt.length > 0
    && account.salt.length <= 1_024;
}

function accountFingerprint(account: StoredLegacyAccount): string {
  const material = JSON.stringify([
    account.id, account.username, account.email, account.passHash, account.salt, account.createdAt
  ]);
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < material.length; index += 1) {
    const code = material.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193) >>> 0;
    second = Math.imul(second ^ code, 0x85ebca6b) >>> 0;
  }
  return `${first.toString(16).padStart(8, '0')}${second.toString(16).padStart(8, '0')}`;
}

function localAccounts(): StoredLegacyAccount[] {
  const parsed = readBoundedJson(USERS_KEY, USERS_RAW_CAP);
  if (!Array.isArray(parsed) || parsed.length > ACCOUNT_CAP) return [];
  return parsed.filter(validLegacyAccount);
}

function publicAccount(account: StoredLegacyAccount): LegacyAccount {
  return {
    id: account.id,
    username: account.username.trim().normalize('NFKC'),
    email: normalizedIdentity(account.email),
    createdAt: account.createdAt
  };
}

function normalizedActivity(value: unknown): { tool: string; ts: number } | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const event = value as Record<string, unknown>;
  if (typeof event.tool !== 'string' || !ALLOWED_TOOLS.has(event.tool)) return null;
  if (typeof event.ts !== 'number' || !Number.isFinite(event.ts) || event.ts > Date.now() + 5 * 60_000) return null;
  return { tool: event.tool, ts: event.ts };
}

function eventKey(event: { tool: string; ts: number }): string {
  return `legacy:${event.ts}:${event.tool}`;
}

function localActivity(userId: string): Array<{ tool: string; ts: number }> {
  const parsed = readBoundedJson(ACTIVITY_KEY, ACTIVITY_RAW_CAP);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return [];
  const events = (parsed as Record<string, unknown>)[userId];
  if (!Array.isArray(events)) return [];
  return events.slice(-LOCAL_ACTIVITY_READ_CAP)
    .map(normalizedActivity)
    .filter((event): event is { tool: string; ts: number } => event !== null);
}

function boundedString(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length <= max;
}

function httpUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol;
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

function allowedPins(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  return entries.length <= 64 && entries.every(([key, pin]) => key.length <= 64 && boundedString(pin, 128));
}

function allowlistedAiConfig(value: StoredAiConfig | null): LegacyAiConfig | null {
  if (!value || typeof value !== 'object') return null;
  if (typeof value.protocol !== 'string' || !AI_PROTOCOLS.has(value.protocol)) return null;
  if (!boundedString(value.baseUrl, 2048) || !httpUrl(value.baseUrl)) return null;
  if (!boundedString(value.apiKey, 4096) || !boundedString(value.model, 256)) return null;
  if (typeof value.deviceKind !== 'string' || !DEVICE_KINDS.has(value.deviceKind)) return null;
  if (!boundedString(value.deviceId, 128) || !boundedString(value.customDevice, 256)) return null;
  if (!boundedString(value.platformId, 128) || !boundedString(value.extra, 4096)) return null;
  if (typeof value.bus !== 'string' || !BUS_PROTOCOLS.has(value.bus)) return null;
  if (!allowedPins(value.pins)) return null;
  if (!boundedString(value.i2cAddr, 32) || !boundedString(value.busFreq, 32) || !boundedString(value.uartBaud, 32)) return null;
  return {
    protocol: value.protocol as LegacyAiConfig['protocol'],
    baseUrl: value.baseUrl,
    apiKey: value.apiKey,
    model: value.model,
    deviceKind: value.deviceKind as LegacyAiConfig['deviceKind'],
    deviceId: value.deviceId,
    customDevice: value.customDevice,
    platformId: value.platformId,
    extra: value.extra,
    bus: value.bus as LegacyAiConfig['bus'],
    pins: { ...value.pins },
    i2cAddr: value.i2cAddr,
    busFreq: value.busFreq,
    uartBaud: value.uartBaud
  };
}

function sameAiConfig(left: LegacyAiConfig | null, right: LegacyAiConfig | null): boolean {
  if (!left || !right) return left === right;
  const fields = [
    'protocol', 'baseUrl', 'apiKey', 'model', 'deviceKind', 'deviceId', 'customDevice',
    'platformId', 'extra', 'bus', 'i2cAddr', 'busFreq', 'uartBaud'
  ] as const;
  if (fields.some((field) => left[field] !== right[field])) return false;
  const leftPins = Object.keys(left.pins);
  const rightPins = Object.keys(right.pins);
  return leftPins.length === rightPins.length
    && leftPins.every((pin) => left.pins[pin] === right.pins[pin]);
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
  });
}

function openLegacyDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined' || indexedDB === null) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Legacy IndexedDB open failed'));
    request.onblocked = () => reject(new Error('Legacy IndexedDB open blocked'));
  });
}

async function indexedAccounts(database: IDBDatabase | null): Promise<StoredLegacyAccount[]> {
  if (!database?.objectStoreNames.contains(STORE_USERS)) return [];
  const transaction = database.transaction(STORE_USERS, 'readonly');
  const done = transactionDone(transaction);
  const store = transaction.objectStore(STORE_USERS);
  const accounts = await new Promise<StoredLegacyAccount[]>((resolve, reject) => {
    const values: StoredLegacyAccount[] = [];
    let count = 0;
    const request = store.openCursor();
    request.onerror = () => reject(request.error ?? new Error('Legacy account cursor failed'));
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        resolve(values);
        return;
      }
      count += 1;
      if (count > ACCOUNT_CAP) {
        resolve([]);
        return;
      }
      if (validLegacyAccount(cursor.value)) values.push(cursor.value);
      cursor.continue();
    };
  });
  await done;
  return accounts;
}

async function indexedActivity(database: IDBDatabase | null, userId: string): Promise<IndexedActivityCleanup[]> {
  if (!database?.objectStoreNames.contains(STORE_ACTIVITY)) return [];
  const transaction = database.transaction(STORE_ACTIVITY, 'readonly');
  const done = transactionDone(transaction);
  const store = transaction.objectStore(STORE_ACTIVITY);
  const hasUserIndex = store.indexNames.contains('userId') && typeof IDBKeyRange !== 'undefined';
  const source: IDBIndex | IDBObjectStore = hasUserIndex ? store.index('userId') : store;
  const range = hasUserIndex ? IDBKeyRange.only(userId) : null;
  const rows = await new Promise<IndexedActivityCleanup[]>((resolve, reject) => {
    const values: IndexedActivityCleanup[] = [];
    let scanned = 0;
    const request = source.openCursor(range, 'prev');
    request.onerror = () => reject(request.error ?? new Error('Legacy activity cursor failed'));
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor || values.length >= ACTIVITY_CAP || scanned >= ACTIVITY_CURSOR_SCAN_CAP) {
        resolve(values);
        return;
      }
      scanned += 1;
      const row = cursor.value as Partial<StoredActivity>;
      const normalized = normalizedActivity(row);
      if (row.userId === userId && normalized) {
        values.push({ primaryKey: cursor.primaryKey, userId, ...normalized });
      }
      cursor.continue();
    };
  });
  await done;
  return rows;
}

async function indexedAiConfig(database: IDBDatabase | null, userId: string): Promise<LegacyAiConfig | null> {
  if (!database?.objectStoreNames.contains(STORE_AI_CONFIG)) return null;
  const transaction = database.transaction(STORE_AI_CONFIG, 'readonly');
  const done = transactionDone(transaction);
  const row = await requestResult(
    transaction.objectStore(STORE_AI_CONFIG).get(userId) as IDBRequest<StoredAiConfig | undefined>
  );
  await done;
  return allowlistedAiConfig(row ?? null);
}

function capturedActivity(
  local: Array<{ tool: string; ts: number }>,
  indexed: IndexedActivityCleanup[]
): { activity: LegacyActivityEvent[]; localKeys: string[]; indexedRows: IndexedActivityCleanup[] } {
  const captured = new Map<string, CapturedActivity>();
  for (const event of local) {
    const key = eventKey(event);
    const current = captured.get(key);
    if (current) current.local = true;
    else captured.set(key, { event: { key, ...event }, local: true, indexed: [] });
  }
  for (const row of indexed) {
    const key = eventKey(row);
    const current = captured.get(key);
    if (current) current.indexed.push(row);
    else captured.set(key, { event: { key, tool: row.tool, ts: row.ts }, local: false, indexed: [row] });
  }
  const selected = [...captured.values()]
    .sort((left, right) => left.event.ts - right.event.ts || left.event.tool.localeCompare(right.event.tool))
    .slice(-ACTIVITY_CAP);
  return {
    activity: selected.map(({ event }) => event),
    localKeys: selected.filter(({ local: fromLocal }) => fromLocal).map(({ event }) => event.key),
    indexedRows: selected.flatMap(({ indexed: rows }) => rows)
  };
}

export async function matchLegacyCredentials(
  identifier: string,
  password: string
): Promise<LegacyCredentialMatch | null> {
  const identity = normalizedIdentity(identifier);
  let database: IDBDatabase | null = null;
  let durableAccounts: StoredLegacyAccount[] = [];
  try {
    database = await openLegacyDb();
    durableAccounts = await indexedAccounts(database);
  } catch {
    database?.close();
    database = null;
  }
  try {
    const accounts = [...localAccounts(), ...durableAccounts];
    for (const account of accounts) {
      if (normalizedIdentity(account.username) !== identity && normalizedIdentity(account.email) !== identity) continue;
      let passwordMatches = false;
      try {
        passwordMatches = await hashPassword(password, account.salt) === account.passHash;
      } catch {
        passwordMatches = false;
      }
      if (!passwordMatches) continue;
      const [durableActivity, aiConfig] = await Promise.all([
        indexedActivity(database, account.id),
        indexedAiConfig(database, account.id)
      ]);
      const captured = capturedActivity(localActivity(account.id), durableActivity);
      return {
        account: publicAccount(account),
        activity: captured.activity,
        aiConfig,
        cleanup: {
          accountId: account.id,
          accountFingerprint: accountFingerprint(account),
          localActivityKeys: captured.localKeys,
          indexedActivity: captured.indexedRows,
          aiConfig
        }
      };
    }
    return null;
  } finally {
    database?.close();
  }
}

function prepareLocalCleanup(snapshot: LegacyCleanupSnapshot): LocalCleanupPlan {
  const users = readRequiredBoundedJson(USERS_KEY, USERS_RAW_CAP);
  let usersValue: string | null | undefined;
  let removeSession = false;
  if (!users.exists) {
    removeSession = localStorage.getItem(SESSION_KEY) === snapshot.accountId;
  } else {
    if (!Array.isArray(users.value) || users.value.length > ACCOUNT_CAP) {
      throw new Error('Legacy accounts changed before cleanup');
    }
    let removed = false;
    const remaining = users.value.filter((value) => {
      if (!validLegacyAccount(value) || value.id !== snapshot.accountId) return true;
      if (accountFingerprint(value) !== snapshot.accountFingerprint) return true;
      removed = true;
      return false;
    });
    const sameAccountRemains = remaining.some((value) => (
      Boolean(value) && typeof value === 'object' && !Array.isArray(value)
      && (value as Record<string, unknown>).id === snapshot.accountId
    ));
    removeSession = localStorage.getItem(SESSION_KEY) === snapshot.accountId && !sameAccountRemains;
    if (removed) usersValue = remaining.length === 0 ? null : JSON.stringify(remaining);
  }

  const activity = readRequiredBoundedJson(ACTIVITY_KEY, ACTIVITY_RAW_CAP);
  let activityValue: string | null | undefined;
  if (activity.exists) {
    if (!activity.value || typeof activity.value !== 'object' || Array.isArray(activity.value)) {
      throw new Error('Legacy activity changed before cleanup');
    }
    const allActivity = { ...(activity.value as Record<string, unknown>) };
    const accountEvents = allActivity[snapshot.accountId];
    if (Array.isArray(accountEvents)) {
      const capturedKeys = new Set(snapshot.localActivityKeys);
      const remainingEvents = accountEvents.filter((value) => {
        const event = normalizedActivity(value);
        return !event || !capturedKeys.has(eventKey(event));
      });
      if (remainingEvents.length !== accountEvents.length) {
        if (remainingEvents.length === 0) delete allActivity[snapshot.accountId];
        else allActivity[snapshot.accountId] = remainingEvents;
        activityValue = Object.keys(allActivity).length === 0 ? null : JSON.stringify(allActivity);
      }
    }
  }
  return { users: usersValue, activity: activityValue, removeSession };
}

function currentActivityMatches(value: unknown, selector: IndexedActivityCleanup): boolean {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return row.userId === selector.userId && row.tool === selector.tool && row.ts === selector.ts;
}

async function cleanupIndexedDb(snapshot: LegacyCleanupSnapshot): Promise<void> {
  const database = await openLegacyDb();
  if (!database) return;
  try {
    const stores = [STORE_USERS, STORE_ACTIVITY, STORE_AI_CONFIG]
      .filter((store) => database.objectStoreNames.contains(store));
    if (stores.length === 0) return;
    const transaction = database.transaction(stores, 'readwrite');
    const done = transactionDone(transaction);
    try {
      if (stores.includes(STORE_USERS)) {
        const users = transaction.objectStore(STORE_USERS);
        const request = users.get(snapshot.accountId) as IDBRequest<StoredLegacyAccount | undefined>;
        request.onsuccess = () => {
          if (request.result && validLegacyAccount(request.result)
            && accountFingerprint(request.result) === snapshot.accountFingerprint) {
            users.delete(snapshot.accountId);
          }
        };
      }
      if (stores.includes(STORE_ACTIVITY)) {
        const activity = transaction.objectStore(STORE_ACTIVITY);
        for (const selector of snapshot.indexedActivity) {
          const request = activity.get(selector.primaryKey);
          request.onsuccess = () => {
            if (currentActivityMatches(request.result, selector)) activity.delete(selector.primaryKey);
          };
        }
      }
      if (stores.includes(STORE_AI_CONFIG) && snapshot.aiConfig) {
        const aiConfig = transaction.objectStore(STORE_AI_CONFIG);
        const request = aiConfig.get(snapshot.accountId) as IDBRequest<StoredAiConfig | undefined>;
        request.onsuccess = () => {
          if (sameAiConfig(allowlistedAiConfig(request.result ?? null), snapshot.aiConfig)) {
            aiConfig.delete(snapshot.accountId);
          }
        };
      }
    } catch (error) {
      await done.catch(() => undefined);
      throw error;
    }
    await done;
  } finally {
    database.close();
  }
}

function applyLocalCleanup(plan: LocalCleanupPlan) {
  if (plan.users === null) localStorage.removeItem(USERS_KEY);
  else if (plan.users !== undefined) localStorage.setItem(USERS_KEY, plan.users);
  if (plan.activity === null) localStorage.removeItem(ACTIVITY_KEY);
  else if (plan.activity !== undefined) localStorage.setItem(ACTIVITY_KEY, plan.activity);
  if (plan.removeSession) localStorage.removeItem(SESSION_KEY);
}

export async function cleanupLegacyAccount(snapshot: LegacyCleanupSnapshot): Promise<void> {
  prepareLocalCleanup(snapshot);
  await cleanupIndexedDb(snapshot);
  applyLocalCleanup(prepareLocalCleanup(snapshot));
}
