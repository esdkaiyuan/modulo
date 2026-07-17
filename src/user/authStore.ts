import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { sendVerifyCode, verifyEmailCode } from './authApi';
import { hashPassword, randomSalt } from './passwordHash';
import { setCurrentUserId } from './identity';
import { dbGetAllUsers, dbSyncUsers } from './localDb';
import { t } from '../i18n';

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  passHash: string;
  salt: string;
  createdAt: number;
}

const USERS_KEY = 'dms-users';
const SESSION_KEY = 'dms-session';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function loadUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/** First character of the username (handles surrogate pairs / CJK). */
export function avatarCharFor(username: string): string {
  const first = [...username.trim()][0] ?? '?';
  return first.toUpperCase();
}

/** Stable hue derived from the username, for the avatar background. */
export function avatarHueFor(username: string): number {
  let acc = 0;
  for (const ch of username) acc = (acc * 31 + ch.codePointAt(0)!) >>> 0;
  return acc % 360;
}

export const useAuthStore = defineStore('auth', () => {
  const users = ref<UserAccount[]>(loadUsers());
  const sessionId = ref<string | null>(localStorage.getItem(SESSION_KEY));

  const currentUser = computed(() => users.value.find((u) => u.id === sessionId.value) ?? null);

  // Bind the watermark's second block to the logged-in username.
  watch(currentUser, (u) => setCurrentUserId(u ? u.username : null), { immediate: true });

  // Rehydrate from the durable database: if IndexedDB holds accounts that
  // localStorage lost (e.g. site data partially cleared), restore them. Runs
  // once on store creation; localStorage stays the synchronous source.
  void (async () => {
    const dbUsers = await dbGetAllUsers();
    if (dbUsers.length === 0) {
      // Seed the DB from whatever localStorage already has.
      if (users.value.length > 0) void dbSyncUsers(users.value);
      return;
    }
    const known = new Set(users.value.map((u) => u.id));
    const merged = [...users.value];
    for (const u of dbUsers) {
      if (!known.has(u.id)) merged.push(u);
    }
    if (merged.length !== users.value.length) {
      users.value = merged;
      localStorage.setItem(USERS_KEY, JSON.stringify(merged));
    }
  })();

  const authError = ref('');
  const notice = ref('');
  const busy = ref(false);
  const sendingCode = ref(false);
  const codeCooldown = ref(0);
  let cooldownTimer: ReturnType<typeof setInterval> | null = null;

  /** Route the user tried to open before being sent to the login page. */
  const redirectTarget = ref<string | null>(null);

  /** Called by the route guard: remember the destination and show a hint. */
  function requireLogin(route: string) {
    redirectTarget.value = route;
    authError.value = '';
    notice.value = t('auth.needLogin');
  }

  /** Where to go after a successful login/register; consumed once. */
  function consumeRedirect(): string | null {
    const target = redirectTarget.value;
    redirectTarget.value = null;
    return target;
  }

  function persistUsers() {
    localStorage.setItem(USERS_KEY, JSON.stringify(users.value));
    // Mirror into the durable IndexedDB store (best-effort, async).
    void dbSyncUsers(users.value);
  }

  function setSession(id: string | null) {
    sessionId.value = id;
    if (id) localStorage.setItem(SESSION_KEY, id);
    else localStorage.removeItem(SESSION_KEY);
  }

  function clearMessages() {
    authError.value = '';
    notice.value = '';
  }

  function startCooldown(seconds: number) {
    codeCooldown.value = seconds;
    if (cooldownTimer) clearInterval(cooldownTimer);
    cooldownTimer = setInterval(() => {
      codeCooldown.value -= 1;
      if (codeCooldown.value <= 0 && cooldownTimer) {
        clearInterval(cooldownTimer);
        cooldownTimer = null;
      }
    }, 1000);
  }

  function findByName(name: string): UserAccount | undefined {
    const key = name.trim().toLowerCase();
    return users.value.find((u) => u.username.toLowerCase() === key);
  }

  function findByEmail(email: string): UserAccount | undefined {
    const key = email.trim().toLowerCase();
    return users.value.find((u) => u.email.toLowerCase() === key);
  }

  async function requestCode(email: string): Promise<boolean> {
    clearMessages();
    if (!EMAIL_RE.test(email.trim())) {
      authError.value = t('auth.errBadEmail');
      return false;
    }
    if (findByEmail(email)) {
      authError.value = t('auth.errEmailTaken');
      return false;
    }
    if (sendingCode.value || codeCooldown.value > 0) return false;
    sendingCode.value = true;
    const res = await sendVerifyCode(email.trim());
    sendingCode.value = false;
    if (!res.success) {
      authError.value = res.message || t('auth.errNetwork');
      return false;
    }
    notice.value = t('auth.codeSent');
    startCooldown(60);
    return true;
  }

  async function register(input: {
    username: string;
    email: string;
    password: string;
    confirm: string;
    code: string;
  }): Promise<boolean> {
    clearMessages();
    const username = input.username.trim();
    const email = input.email.trim();
    if ([...username].length < 2 || [...username].length > 20) {
      authError.value = t('auth.errBadUsername');
      return false;
    }
    if (findByName(username)) {
      authError.value = t('auth.errUserTaken');
      return false;
    }
    if (!EMAIL_RE.test(email)) {
      authError.value = t('auth.errBadEmail');
      return false;
    }
    if (findByEmail(email)) {
      authError.value = t('auth.errEmailTaken');
      return false;
    }
    if (input.password.length < 6) {
      authError.value = t('auth.errBadPass');
      return false;
    }
    if (input.password !== input.confirm) {
      authError.value = t('auth.errMismatch');
      return false;
    }
    if (!input.code.trim()) {
      authError.value = t('auth.errNoCode');
      return false;
    }
    busy.value = true;
    try {
      const res = await verifyEmailCode(email, input.code.trim());
      if (!res.success) {
        authError.value = res.message || t('auth.errNetwork');
        return false;
      }
      const salt = randomSalt();
      const passHash = await hashPassword(input.password, salt);
      const user: UserAccount = {
        id: `u-${Date.now().toString(36)}-${salt.slice(0, 6)}`,
        username,
        email,
        passHash,
        salt,
        createdAt: Date.now()
      };
      users.value = [...users.value, user];
      persistUsers();
      setSession(user.id);
      return true;
    } finally {
      busy.value = false;
    }
  }

  async function login(identifier: string, password: string): Promise<boolean> {
    clearMessages();
    const user = findByName(identifier) ?? findByEmail(identifier);
    if (!user) {
      authError.value = t('auth.errNoUser');
      return false;
    }
    busy.value = true;
    try {
      const hash = await hashPassword(password, user.salt);
      if (hash !== user.passHash) {
        authError.value = t('auth.errWrongPass');
        return false;
      }
      setSession(user.id);
      return true;
    } finally {
      busy.value = false;
    }
  }

  function logout() {
    clearMessages();
    setSession(null);
  }

  /** Rename the logged-in user; the avatar and watermark follow automatically. */
  function renameUser(newName: string): boolean {
    clearMessages();
    const user = currentUser.value;
    if (!user) return false;
    const name = newName.trim();
    if ([...name].length < 2 || [...name].length > 20) {
      authError.value = t('auth.errBadUsername');
      return false;
    }
    const existing = findByName(name);
    if (existing && existing.id !== user.id) {
      authError.value = t('auth.errUserTaken');
      return false;
    }
    user.username = name;
    persistUsers();
    // Re-sync the watermark (the watcher only fires on user identity change).
    setCurrentUserId(name);
    notice.value = t('auth.nameChanged');
    return true;
  }

  async function changePassword(oldPass: string, newPass: string): Promise<boolean> {
    clearMessages();
    const user = currentUser.value;
    if (!user) return false;
    if (newPass.length < 6) {
      authError.value = t('auth.errBadPass');
      return false;
    }
    const oldHash = await hashPassword(oldPass, user.salt);
    if (oldHash !== user.passHash) {
      authError.value = t('auth.errWrongOld');
      return false;
    }
    const salt = randomSalt();
    user.salt = salt;
    user.passHash = await hashPassword(newPass, salt);
    persistUsers();
    notice.value = t('auth.passChanged');
    return true;
  }

  function deleteAccount(): void {
    const user = currentUser.value;
    if (!user) return;
    users.value = users.value.filter((u) => u.id !== user.id);
    persistUsers();
    setSession(null);
  }

  return {
    users,
    currentUser,
    authError,
    notice,
    busy,
    sendingCode,
    codeCooldown,
    redirectTarget,
    requireLogin,
    consumeRedirect,
    requestCode,
    register,
    login,
    logout,
    renameUser,
    changePassword,
    deleteAccount,
    clearMessages
  };
});
