<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import AuthShowcase from '../components/AuthShowcase.vue';
import { EMAIL_RE, useAuthStore } from '../user/authStore';
import { t } from '../i18n';

const auth = useAuthStore();
const tab = ref<'login' | 'register'>('login');

const loginId = ref('');
const loginPass = ref('');
const migrationCode = ref('');
const migrationUsername = ref('');

const regUsername = ref('');
const regEmail = ref('');
const regPass = ref('');
const regConfirm = ref('');
const regCode = ref('');

// Live per-field state: null = untouched (neutral hint), true = ok, false = bad
type FieldState = boolean | null;
const state = (filled: boolean, ok: boolean): FieldState => (filled ? ok : null);

const usernameState = computed<FieldState>(() => {
  const len = [...regUsername.value.trim()].length;
  return state(regUsername.value !== '', len >= 2 && len <= 20);
});
const emailState = computed<FieldState>(() =>
  state(regEmail.value !== '', EMAIL_RE.test(regEmail.value.trim()))
);
const codeState = computed<FieldState>(() =>
  state(regCode.value !== '', /^\d{4,8}$/.test(regCode.value.trim()))
);
const passState = computed<FieldState>(() => state(
  regPass.value !== '', regPass.value.length >= 8 && regPass.value.length <= 128
));
const confirmState = computed<FieldState>(() =>
  state(regConfirm.value !== '', regConfirm.value === regPass.value && regPass.value.length >= 8 && regPass.value.length <= 128)
);

const hintClass = (s: FieldState) => (s === null ? '' : s ? 'ok' : 'bad');

watch(tab, () => auth.clearMessages());

function afterAuth() {
  const target = auth.consumeRedirect();
  window.location.hash = `#/${target ?? 'profile'}`;
}

async function doLogin() {
  if (await auth.login(loginId.value, loginPass.value)) {
    afterAuth();
  }
}

async function doRegister() {
  const ok = await auth.register({
    username: regUsername.value,
    email: regEmail.value,
    password: regPass.value,
    confirm: regConfirm.value,
    code: regCode.value
  });
  if (ok) afterAuth();
}

async function doLegacyMigration() {
  const ok = await auth.completeLegacyMigration(migrationCode.value, migrationUsername.value || undefined);
  if (ok) afterAuth();
}
</script>

<template>
  <div class="auth-wrap">
    <div class="auth-layout">
      <AuthShowcase />
      <div class="auth-form-side">
        <div class="auth-tabs">
          <button class="btn sm" :class="{ primary: tab === 'login' }" data-test="tab-login" @click="tab = 'login'">
            {{ t('auth.login') }}
          </button>
          <button class="btn sm" :class="{ primary: tab === 'register' }" data-test="tab-register" @click="tab = 'register'">
            {{ t('auth.register') }}
          </button>
        </div>
        <h2 class="auth-heading">
          {{ auth.legacyMigration ? 'Move your legacy account' : tab === 'login' ? t('auth.welcomeBack') : t('auth.createAccount') }}
        </h2>

      <form
        v-if="auth.legacyMigration"
        class="field-stack legacy-migration-panel"
        data-test="migration-form"
        @submit.prevent="doLegacyMigration"
      >
        <div class="legacy-migration-intro" data-test="legacy-migration">
          <span class="legacy-migration-icon" aria-hidden="true">↗</span>
          <div>
            <b>Legacy account found</b>
            <p>Verify {{ auth.legacyMigration.maskedEmail }} to securely move your account and saved settings.</p>
          </div>
        </div>
        <div class="auth-code-row">
          <label class="field">
            <span>Six-digit code</span>
            <input
              v-model="migrationCode"
              type="text"
              inputmode="numeric"
              maxlength="6"
              autocomplete="one-time-code"
              data-test="migration-code"
              placeholder="123456"
            />
          </label>
          <button
            class="btn sm"
            type="button"
            data-test="migration-send-code"
            :disabled="auth.legacySendingCode || auth.legacyCodeCooldown > 0 || auth.busy"
            @click="auth.sendLegacyCode()"
          >
            <template v-if="auth.legacyCodeCooldown > 0">Resend ({{ auth.legacyCodeCooldown }}s)</template>
            <template v-else>{{ auth.legacyMigration.needsCode ? 'Send code' : 'Resend code' }}</template>
          </button>
        </div>
        <label v-if="auth.legacyMigration.usernameConflict" class="field">
          <span>Choose a new username</span>
          <input
            v-model="migrationUsername"
            type="text"
            autocomplete="username"
            data-test="migration-username"
            placeholder="2–20 characters"
          />
          <small class="field-hint">Your legacy username is already in use.</small>
        </label>
        <div class="migration-progress" data-test="migration-progress" aria-live="polite">
          <span v-if="auth.legacyMigrationProgress" class="migration-spinner" aria-hidden="true"></span>
          {{ auth.legacyMigrationProgress }}
        </div>
        <div class="migration-message-slot">
          <div class="alert-error" data-test="migration-error" aria-live="polite">{{ auth.authError }}</div>
        </div>
        <div class="migration-actions">
          <button class="btn" type="button" data-test="migration-cancel" @click="auth.cancelLegacyMigration()">
            Cancel
          </button>
          <button
            class="btn primary"
            type="submit"
            data-test="migration-submit"
            :disabled="auth.busy || auth.legacySendingCode || auth.legacyMigration.needsCode || !/^\d{6}$/.test(migrationCode) || (auth.legacyMigration.usernameConflict && !migrationUsername.trim())"
          >
            Move account
          </button>
        </div>
      </form>

      <form v-else-if="tab === 'login'" class="field-stack" data-test="login-form" @submit.prevent="doLogin">
        <label class="field">
          <span>{{ t('auth.identifier') }}</span>
          <input v-model="loginId" type="text" data-test="login-id" autocomplete="username" />
        </label>
        <label class="field">
          <span>{{ t('auth.password') }}</span>
          <input v-model="loginPass" type="password" data-test="login-pass" autocomplete="current-password" />
        </label>
        <div v-if="auth.authError" class="alert-error" data-test="auth-error">{{ auth.authError }}</div>
        <div v-else-if="auth.notice" class="auth-notice" data-test="auth-notice">{{ auth.notice }}</div>
        <button class="btn primary" type="submit" data-test="login-submit" :disabled="auth.busy || !loginId || !loginPass">
          {{ t('auth.login') }}
        </button>
      </form>

      <form v-else class="field-stack" data-test="register-form" @submit.prevent="doRegister">
        <label class="field">
          <span>{{ t('auth.username') }}</span>
          <input
            v-model="regUsername"
            type="text"
            data-test="reg-username"
            autocomplete="username"
            :placeholder="t('auth.phUsername')"
          />
          <small class="field-hint" :class="hintClass(usernameState)" data-test="hint-username">
            {{ usernameState === false ? t('auth.errBadUsername') : t('auth.hintUsername') }}
          </small>
        </label>
        <label class="field">
          <span>{{ t('auth.email') }}</span>
          <input
            v-model="regEmail"
            type="email"
            data-test="reg-email"
            autocomplete="email"
            :placeholder="t('auth.phEmail')"
          />
          <small class="field-hint" :class="hintClass(emailState)" data-test="hint-email">
            {{ emailState === false ? t('auth.errBadEmail') : t('auth.hintEmail') }}
          </small>
        </label>
        <div class="auth-code-row">
          <label class="field" style="flex: 1">
            <span>{{ t('auth.code') }}</span>
            <input
              v-model="regCode"
              type="text"
              inputmode="numeric"
              data-test="reg-code"
              :placeholder="t('auth.phCode')"
            />
            <small class="field-hint" :class="hintClass(codeState)" data-test="hint-code">
              {{ t('auth.hintCode') }}
            </small>
          </label>
          <button
            class="btn sm"
            type="button"
            data-test="reg-send-code"
            :disabled="auth.sendingCode || auth.codeCooldown > 0 || !regEmail"
            @click="auth.requestCode(regEmail)"
          >
            {{ auth.codeCooldown > 0 ? t('auth.resend', { n: auth.codeCooldown }) : t('auth.sendCode') }}
          </button>
        </div>
        <label class="field">
          <span>{{ t('auth.password') }}</span>
          <input
            v-model="regPass"
            type="password"
            data-test="reg-pass"
            autocomplete="new-password"
            :placeholder="t('auth.phPass')"
          />
          <small class="field-hint" :class="hintClass(passState)" data-test="hint-pass">
            {{ passState === false ? t('auth.errBadPass') : t('auth.hintPass') }}
          </small>
        </label>
        <label class="field">
          <span>{{ t('auth.confirm') }}</span>
          <input
            v-model="regConfirm"
            type="password"
            data-test="reg-confirm"
            autocomplete="new-password"
            :placeholder="t('auth.phConfirm')"
          />
          <small class="field-hint" :class="hintClass(confirmState)" data-test="hint-confirm">
            {{ confirmState === false ? t('auth.errMismatch') : t('auth.hintConfirm') }}
          </small>
        </label>
        <div v-if="auth.authError" class="alert-error" data-test="auth-error">{{ auth.authError }}</div>
        <div v-else-if="auth.notice" class="auth-notice" data-test="auth-notice">{{ auth.notice }}</div>
        <button class="btn primary" type="submit" data-test="reg-submit" :disabled="auth.busy">
          {{ t('auth.register') }}
        </button>
      </form>
      </div>
    </div>
  </div>
</template>
