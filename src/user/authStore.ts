import { ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { t } from '../i18n';
import type { MessageKey } from '../i18n/messages';
import { setCurrentUserId } from './identity';
import {
  cleanupLegacyAccount,
  matchLegacyCredentials,
  type LegacyAiConfig,
  type LegacyCredentialMatch
} from './legacyStorage';
import { request, ServerApiError, type PublicUser } from './serverApi';

export type { PublicUser } from './serverApi';

export interface RegistrationInput {
  username: string;
  email: string;
  password: string;
  confirm: string;
  code: string;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface UserResponse {
  user: PublicUser;
}

export interface LegacyMigrationState {
  maskedEmail: string;
  needsCode: boolean;
  usernameConflict: boolean;
}

interface LegacyMigrationResponse extends UserResponse {
  imported: {
    activityCount: number;
    aiConfig: boolean;
  };
}

interface ActivityResponse {
  events: Array<{ id: string; tool: string; ts: number }>;
}

interface AiConfigResponse {
  config: LegacyAiConfig | null;
}

const ALLOWED_ACTIVITY_TOOLS = new Set([
  'image', 'video', 'animation', 'font', 'batch', 'handdraw', 'audio', 'bead', 'ai'
]);

function isUserResponse(value: unknown): value is UserResponse {
  if (!value || typeof value !== 'object' || !('user' in value)) return false;
  const user = value.user;
  if (!user || typeof user !== 'object') return false;
  const fields = user as Record<string, unknown>;
  return typeof fields.id === 'string'
    && typeof fields.username === 'string'
    && typeof fields.email === 'string'
    && typeof fields.createdAt === 'number';
}

function isLegacyMigrationResponse(value: unknown): value is LegacyMigrationResponse {
  if (!isUserResponse(value) || !('imported' in value)) return false;
  const imported = value.imported;
  if (!imported || typeof imported !== 'object') return false;
  const fields = imported as Record<string, unknown>;
  return typeof fields.activityCount === 'number'
    && Number.isInteger(fields.activityCount)
    && fields.activityCount >= 0
    && fields.activityCount <= 500
    && typeof fields.aiConfig === 'boolean';
}

function isActivityResponse(value: unknown): value is ActivityResponse {
  if (!value || typeof value !== 'object' || !('events' in value)
    || !Array.isArray(value.events) || value.events.length > 500) return false;
  return value.events.every((event) => {
    if (!event || typeof event !== 'object') return false;
    const fields = event as Record<string, unknown>;
    return typeof fields.id === 'string'
      && typeof fields.tool === 'string'
      && ALLOWED_ACTIVITY_TOOLS.has(fields.tool)
      && typeof fields.ts === 'number'
      && Number.isFinite(fields.ts);
  });
}

function isLegacyAiConfig(value: unknown): value is LegacyAiConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const fields = value as Record<string, unknown>;
  const stringBounds = {
    baseUrl: 2048,
    apiKey: 4096,
    model: 256,
    deviceId: 128,
    customDevice: 256,
    platformId: 128,
    extra: 4096,
    i2cAddr: 32,
    busFreq: 32,
    uartBaud: 32
  } as const;
  if (!Object.entries(stringBounds).every(([field, maximum]) => (
    typeof fields[field] === 'string' && fields[field].length <= maximum
  ))) return false;
  if (fields.protocol !== 'openai' && fields.protocol !== 'anthropic') return false;
  if (fields.deviceKind !== 'display' && fields.deviceKind !== 'audio') return false;
  if (!['i2c', 'spi', 'i2s', 'pwm', 'dac', 'onewire', 'uart'].includes(String(fields.bus))) return false;
  try {
    const protocol = new URL(fields.baseUrl as string).protocol;
    if (protocol !== 'http:' && protocol !== 'https:') return false;
  } catch {
    return false;
  }
  if (!fields.pins || typeof fields.pins !== 'object' || Array.isArray(fields.pins)) return false;
  const pins = Object.entries(fields.pins);
  return pins.length <= 64 && pins.every(([pin, assignment]) => (
    pin.length <= 64 && typeof assignment === 'string' && assignment.length <= 128
  ));
}

function isAiConfigResponse(value: unknown): value is AiConfigResponse {
  if (!value || typeof value !== 'object' || !('config' in value)) return false;
  return value.config === null || isLegacyAiConfig(value.config);
}

function maskEmail(email: string): string {
  const separator = email.indexOf('@');
  if (separator <= 0) return '***';
  return `${email.slice(0, 1)}***${email.slice(separator)}`;
}

function sameUser(left: PublicUser, right: PublicUser): boolean {
  return left.id === right.id
    && left.username === right.username
    && left.email === right.email
    && left.createdAt === right.createdAt;
}

function normalizedEmail(value: string): string {
  return value.trim().normalize('NFKC').toLocaleLowerCase('en-US');
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

/** First character of the username (handles surrogate pairs / CJK). */
export function avatarCharFor(username: string): string {
  const first = [...username.trim()][0] ?? '?';
  return first.toUpperCase();
}

/** Stable hue derived from the username, for the avatar background. */
export function avatarHueFor(username: string): number {
  let accumulator = 0;
  for (const character of username) accumulator = (accumulator * 31 + character.codePointAt(0)!) >>> 0;
  return accumulator % 360;
}

function messageFor(error: unknown, credentialMessage: MessageKey = 'auth.errWrongPass'): string {
  if (!(error instanceof ServerApiError)) return t('auth.errNetwork');
  if (error.code === 'EMAIL_TAKEN') return t('auth.errEmailTaken');
  if (error.code === 'USERNAME_TAKEN') return t('auth.errUserTaken');
  if (error.code === 'INVALID_CREDENTIALS') return t(credentialMessage);
  if (error.code === 'INVALID_VERIFICATION_CODE') return t('auth.errNoCode');
  if (error.code === 'INVALID_INPUT') {
    if (error.field === 'username') return t('auth.errBadUsername');
    if (error.field === 'email') return t('auth.errBadEmail');
    if (error.field === 'password' || error.field === 'newPassword') return t('auth.errBadPass');
    if (error.field === 'oldPassword') return t('auth.errWrongOld');
    if (error.field === 'confirm') return t('auth.errMismatch');
    if (error.field === 'code') return t('auth.errNoCode');
  }
  return t('auth.errNetwork');
}

export const useAuthStore = defineStore('auth', () => {
  const status = ref<'restoring' | 'anonymous' | 'authenticated'>('restoring');
  const currentUser = ref<PublicUser | null>(null);
  const authError = ref('');
  const notice = ref('');
  const busy = ref(false);
  const logoutPending = ref(false);
  const sendingCode = ref(false);
  const codeCooldown = ref(0);
  const legacyMigration = ref<LegacyMigrationState | null>(null);
  const legacyMigrationProgress = ref('');
  const legacySendingCode = ref(false);
  const legacyCodeCooldown = ref(0);
  const redirectTarget = ref<string | null>(null);
  let cooldownTimer: ReturnType<typeof setInterval> | null = null;
  let legacyCooldownTimer: ReturnType<typeof setInterval> | null = null;
  let operationGeneration = 0;
  let legacySendGeneration = 0;
  let activeLegacySend: number | null = null;
  let pendingLegacyMatch: LegacyCredentialMatch | null = null;
  let pendingLegacyPassword = '';
  let pendingLogout: Promise<void> | null = null;

  watch(currentUser, (user) => setCurrentUserId(user?.username ?? null), { immediate: true });

  function clearMessages() {
    authError.value = '';
    notice.value = '';
  }

  function setAnonymous() {
    currentUser.value = null;
    status.value = 'anonymous';
  }

  function setAuthenticated(user: PublicUser) {
    currentUser.value = user;
    status.value = 'authenticated';
  }

  function clearLegacyState() {
    legacyMigration.value = null;
    legacyMigrationProgress.value = '';
    legacySendingCode.value = false;
    activeLegacySend = null;
    legacyCodeCooldown.value = 0;
    pendingLegacyMatch = null;
    pendingLegacyPassword = '';
    if (legacyCooldownTimer) clearInterval(legacyCooldownTimer);
    legacyCooldownTimer = null;
  }

  function beginOperation(): number {
    operationGeneration += 1;
    return operationGeneration;
  }

  function isCurrentOperation(generation: number): boolean {
    return generation === operationGeneration;
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

  function startLegacyCooldown(seconds: number) {
    legacyCodeCooldown.value = seconds;
    if (legacyCooldownTimer) clearInterval(legacyCooldownTimer);
    legacyCooldownTimer = setInterval(() => {
      legacyCodeCooldown.value -= 1;
      if (legacyCodeCooldown.value <= 0 && legacyCooldownTimer) {
        clearInterval(legacyCooldownTimer);
        legacyCooldownTimer = null;
      }
    }, 1000);
  }

  function requireLogin(route: string) {
    redirectTarget.value = route;
    authError.value = '';
    notice.value = t('auth.needLogin');
  }

  function consumeRedirect(): string | null {
    const target = redirectTarget.value;
    redirectTarget.value = null;
    return target;
  }

  async function restoreSession(): Promise<void> {
    while (pendingLogout) await pendingLogout;
    clearLegacyState();
    const generation = beginOperation();
    status.value = 'restoring';
    try {
      const result = await request<UserResponse>('/api/auth/session', { validate: isUserResponse });
      if (!isCurrentOperation(generation)) return;
      setAuthenticated(result.user);
    } catch {
      if (!isCurrentOperation(generation)) return;
      setAnonymous();
    }
  }

  async function requestCode(email: string): Promise<boolean> {
    while (pendingLogout) await pendingLogout;
    clearMessages();
    const normalizedEmail = email.trim();
    if (!EMAIL_RE.test(normalizedEmail)) {
      authError.value = t('auth.errBadEmail');
      return false;
    }
    if (sendingCode.value || codeCooldown.value > 0) return false;

    sendingCode.value = true;
    try {
      await request<void>('/api/auth/send-code', { method: 'POST', body: { email: normalizedEmail } });
      notice.value = t('auth.codeSent');
      startCooldown(60);
      return true;
    } catch (error) {
      authError.value = messageFor(error);
      return false;
    } finally {
      sendingCode.value = false;
    }
  }

  async function register(input: RegistrationInput): Promise<boolean> {
    while (pendingLogout) await pendingLogout;
    clearMessages();
    clearLegacyState();
    const username = input.username.trim();
    const email = input.email.trim();
    if ([...username].length < 2 || [...username].length > 20) {
      authError.value = t('auth.errBadUsername');
      return false;
    }
    if (!EMAIL_RE.test(email)) {
      authError.value = t('auth.errBadEmail');
      return false;
    }
    if (input.password.length < 8 || input.password.length > 128) {
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

    const generation = beginOperation();
    busy.value = true;
    try {
      const result = await request<UserResponse>('/api/auth/register', {
        method: 'POST',
        body: { ...input, username, email, code: input.code.trim() },
        validate: isUserResponse
      });
      if (!isCurrentOperation(generation)) return false;
      setAuthenticated(result.user);
      return true;
    } catch (error) {
      if (!isCurrentOperation(generation)) return false;
      authError.value = messageFor(error);
      return false;
    } finally {
      if (isCurrentOperation(generation)) busy.value = false;
    }
  }

  async function login(identifier: string, password: string): Promise<boolean> {
    while (pendingLogout) await pendingLogout;
    clearMessages();
    const generation = beginOperation();
    busy.value = true;
    try {
      const result = await request<UserResponse>('/api/auth/login', {
        method: 'POST',
        body: { identifier: identifier.trim(), password },
        validate: isUserResponse
      });
      if (!isCurrentOperation(generation)) return false;
      clearLegacyState();
      setAuthenticated(result.user);
      return true;
    } catch (error) {
      if (!isCurrentOperation(generation)) return false;
      const loginError = messageFor(error);
      if (!(error instanceof ServerApiError) || error.code !== 'INVALID_CREDENTIALS') {
        clearLegacyState();
        authError.value = loginError;
        return false;
      }
      let legacyMatch: LegacyCredentialMatch | null;
      try {
        legacyMatch = await matchLegacyCredentials(identifier, password);
      } catch {
        if (!isCurrentOperation(generation)) return false;
        authError.value = t('auth.errNetwork');
        return false;
      }
      if (!isCurrentOperation(generation)) return false;
      if (legacyMatch) {
        clearLegacyState();
        pendingLegacyMatch = legacyMatch;
        pendingLegacyPassword = password;
        legacyMigration.value = {
          maskedEmail: maskEmail(legacyMatch.account.email),
          needsCode: true,
          usernameConflict: false
        };
        authError.value = '';
        return false;
      }
      clearLegacyState();
      authError.value = loginError;
      return false;
    } finally {
      if (isCurrentOperation(generation)) busy.value = false;
    }
  }

  async function logout(): Promise<void> {
    if (pendingLogout) return pendingLogout;
    clearMessages();
    const generation = beginOperation();
    logoutPending.value = true;
    clearLegacyState();
    setAnonymous();
    const operation = (async () => {
      try {
        await request<void>('/api/auth/logout', { method: 'POST' });
      } catch (error) {
        if (isCurrentOperation(generation)) authError.value = messageFor(error);
      } finally {
        logoutPending.value = false;
        pendingLogout = null;
      }
    })();
    pendingLogout = operation;
    return operation;
  }

  async function sendLegacyCode(): Promise<boolean> {
    while (pendingLogout) await pendingLogout;
    clearMessages();
    const match = pendingLegacyMatch;
    if (!match || !legacyMigration.value || legacySendingCode.value || legacyCodeCooldown.value > 0) return false;
    const generation = beginOperation();
    const sendGeneration = ++legacySendGeneration;
    activeLegacySend = sendGeneration;
    legacySendingCode.value = true;
    try {
      await request<void>('/api/auth/legacy/send-code', {
        method: 'POST', body: { email: match.account.email }
      });
      if (!isCurrentOperation(generation) || !legacyMigration.value) return false;
      legacyMigration.value = { ...legacyMigration.value, needsCode: false };
      notice.value = t('auth.codeSent');
      startLegacyCooldown(60);
      return true;
    } catch (error) {
      if (!isCurrentOperation(generation)) return false;
      authError.value = messageFor(error);
      return false;
    } finally {
      if (activeLegacySend === sendGeneration) {
        activeLegacySend = null;
        legacySendingCode.value = false;
      }
    }
  }

  async function completeLegacyMigration(code: string, requestedUsername?: string): Promise<boolean> {
    while (pendingLogout) await pendingLogout;
    const match = pendingLegacyMatch;
    const password = pendingLegacyPassword;
    const migration = legacyMigration.value;
    if (!match || !migration || migration.needsCode || legacySendingCode.value || busy.value) return false;
    clearMessages();
    const normalizedCode = code.trim();
    if (!/^\d{6}$/.test(normalizedCode)) {
      authError.value = t('auth.errNoCode');
      return false;
    }
    const username = requestedUsername?.trim();
    if (migration.usernameConflict && (!username || [...username].length < 2 || [...username].length > 20)) {
      authError.value = t('auth.errBadUsername');
      return false;
    }

    const generation = beginOperation();
    busy.value = true;
    legacyMigrationProgress.value = 'Importing legacy account';
    try {
      const body: Record<string, unknown> = {
        account: match.account,
        password,
        code: normalizedCode,
        activity: match.activity,
        aiConfig: match.aiConfig
      };
      if (username) body.requestedUsername = username;
      const migrated = await request<LegacyMigrationResponse>('/api/auth/legacy/migrate', {
        method: 'POST', body, validate: isLegacyMigrationResponse
      });
      if (!isCurrentOperation(generation)) return false;
      legacyMigrationProgress.value = 'Verifying imported data';
      const [session, , aiConfig] = await Promise.all([
        request<UserResponse>('/api/auth/session', { validate: isUserResponse }),
        request<ActivityResponse>('/api/me/activity', { validate: isActivityResponse }),
        request<AiConfigResponse>('/api/me/ai-config', { validate: isAiConfigResponse })
      ]);
      if (!isCurrentOperation(generation)) return false;
      const verified = sameUser(migrated.user, session.user)
        && normalizedEmail(migrated.user.email) === match.account.email
        && migrated.imported.activityCount === match.activity.length
        && (!match.aiConfig || sameAiConfig(aiConfig.config, match.aiConfig));
      if (!verified) throw new Error('Legacy migration verification failed');
      legacyMigrationProgress.value = 'Cleaning up legacy browser data';
      await cleanupLegacyAccount(match.cleanup);
      if (!isCurrentOperation(generation)) return false;
      clearLegacyState();
      setAuthenticated(session.user);
      return true;
    } catch (error) {
      if (!isCurrentOperation(generation)) return false;
      if (error instanceof ServerApiError && error.code === 'USERNAME_TAKEN' && legacyMigration.value) {
        legacyMigration.value = { ...legacyMigration.value, usernameConflict: true };
      }
      legacyMigrationProgress.value = '';
      authError.value = messageFor(error);
      return false;
    } finally {
      if (isCurrentOperation(generation)) busy.value = false;
    }
  }

  function cancelLegacyMigration() {
    beginOperation();
    clearLegacyState();
    clearMessages();
    busy.value = false;
  }

  async function renameUser(username: string): Promise<boolean> {
    while (pendingLogout) await pendingLogout;
    clearMessages();
    const trimmedUsername = username.trim();
    if (!currentUser.value) return false;
    if ([...trimmedUsername].length < 2 || [...trimmedUsername].length > 20) {
      authError.value = t('auth.errBadUsername');
      return false;
    }

    const generation = beginOperation();
    busy.value = true;
    try {
      const result = await request<UserResponse>('/api/me', {
        method: 'PATCH', body: { username: trimmedUsername }, validate: isUserResponse
      });
      if (!isCurrentOperation(generation)) return false;
      setAuthenticated(result.user);
      notice.value = t('auth.nameChanged');
      return true;
    } catch (error) {
      if (!isCurrentOperation(generation)) return false;
      authError.value = messageFor(error);
      return false;
    } finally {
      if (isCurrentOperation(generation)) busy.value = false;
    }
  }


  async function updateBio(bio: string): Promise<boolean> {
    while (pendingLogout) await pendingLogout;
    clearMessages();
    if (!currentUser.value) return false;
    const trimmed = bio.trim();
    if (trimmed.length > 200) {
      authError.value = t('auth.errBioTooLong');
      return false;
    }

    const generation = beginOperation();
    busy.value = true;
    try {
      const result = await request<{ user: PublicUser }>('/api/me/bio', {
        method: 'PATCH', body: { bio: trimmed || null }
      });
      if (!isCurrentOperation(generation)) return false;
      currentUser.value = result.user;
      return true;
    } catch (error) {
      if (!isCurrentOperation(generation)) return false;
      authError.value = messageFor(error, 'auth.errServer');
      return false;
    } finally {
      if (isCurrentOperation(generation)) busy.value = false;
    }
  }  async function changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
    while (pendingLogout) await pendingLogout;
    clearMessages();
    if (!currentUser.value) return false;
    if (newPassword.length < 8 || newPassword.length > 128) {
      authError.value = t('auth.errBadPass');
      return false;
    }

    const generation = beginOperation();
    busy.value = true;
    try {
      await request<void>('/api/me/password', {
        method: 'PATCH', body: { oldPassword, newPassword, confirm: newPassword }
      });
      if (!isCurrentOperation(generation)) return false;
      setAnonymous();
      notice.value = t('auth.passChanged');
      return true;
    } catch (error) {
      if (!isCurrentOperation(generation)) return false;
      authError.value = messageFor(error, 'auth.errWrongOld');
      return false;
    } finally {
      if (isCurrentOperation(generation)) busy.value = false;
    }
  }

  async function deleteAccount(password: string): Promise<boolean> {
    while (pendingLogout) await pendingLogout;
    clearMessages();
    if (!currentUser.value) return false;
    if (!password) {
      authError.value = t('auth.errBadPass');
      return false;
    }

    const generation = beginOperation();
    busy.value = true;
    try {
      await request<void>('/api/me', { method: 'DELETE', body: { password } });
      if (!isCurrentOperation(generation)) return false;
      setAnonymous();
      return true;
    } catch (error) {
      if (!isCurrentOperation(generation)) return false;
      authError.value = messageFor(error, 'auth.errWrongPass');
      return false;
    } finally {
      if (isCurrentOperation(generation)) busy.value = false;
    }
  }

  return {
    status,
    currentUser,
    authError,
    notice,
    busy,
    logoutPending,
    sendingCode,
    codeCooldown,
    legacyMigration,
    legacyMigrationProgress,
    legacySendingCode,
    legacyCodeCooldown,
    redirectTarget,
    requireLogin,
    consumeRedirect,
    restoreSession,
    requestCode,
    register,
    login,
    logout,
    sendLegacyCode,
    completeLegacyMigration,
    cancelLegacyMigration,
    renameUser,
    updateBio,
    changePassword,
    deleteAccount,
    clearMessages
  };
});
