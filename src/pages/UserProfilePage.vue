<script setup lang="ts">
import { computed, ref } from 'vue';
import Panel from '../components/Panel.vue';
import { avatarCharFor, avatarHueFor, useAuthStore } from '../user/authStore';
import { TOOL_META, useActivityStore } from '../user/activityStore';
import { useFileRecordStore } from '../user/fileRecordStore';
import { dbDeleteAiConfig } from '../user/localDb';
import { locale, t } from '../i18n';

const auth = useAuthStore();
const activity = useActivityStore();
const fileRecords = useFileRecordStore();

const oldPass = ref('');
const newPass = ref('');
/** Password typed to confirm account deletion (server verifies it). */
const deletePass = ref('');

// ── Bio ──────────────────────────────────────────────
const editingBio = ref(false);
const bioDraft = ref('');

function startEditBio() {
  bioDraft.value = auth.currentUser?.bio ?? '';
  editingBio.value = true;
}

function cancelEditBio() {
  editingBio.value = false;
  bioDraft.value = '';
}

async function saveBio() {
  if (await auth.updateBio(bioDraft.value)) {
    editingBio.value = false;
  }
}

// ── Rename ───────────────────────────────────────────
const editingName = ref(false);
const nameDraft = ref('');

function startRename() {
  nameDraft.value = auth.currentUser?.username ?? '';
  editingName.value = true;
}

async function saveRename() {
  if (await auth.renameUser(nameDraft.value)) editingName.value = false;
}

const avatarStyle = computed(() => {
  const name = auth.currentUser?.username ?? '';
  return { background: `hsl(${avatarHueFor(name)} 55% 42%)` };
});

const joined = computed(() => {
  const ts = auth.currentUser?.createdAt;
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
});

// ── Stats ────────────────────────────────────────────
const totalUses = computed(() => activity.events.length);

const memberDays = computed(() => {
  const ts = auth.currentUser?.createdAt;
  return ts ? Math.max(1, Math.floor((Date.now() - ts) / 86_400_000) + 1) : 0;
});

const toolCounts = computed(() => {
  const counts = new Map<string, number>();
  for (const e of activity.events) counts.set(e.tool, (counts.get(e.tool) ?? 0) + 1);
  return counts;
});

const favoriteTool = computed(() => {
  let best: string | null = null;
  let max = 0;
  for (const [tool, n] of toolCounts.value) {
    if (n > max) { max = n; best = tool; }
  }
  return best;
});

const toolsTried = computed(() => toolCounts.value.size);

const usageRows = computed(() => {
  const max = Math.max(1, ...toolCounts.value.values());
  return [...toolCounts.value.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tool, n]) => ({ tool, n, pct: Math.max(6, Math.round((n / max) * 100)) }));
});

// ── Pixel activity heatmap: last 12 weeks ────────────
const HEAT_DAYS = 84;

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

const heatmap = computed(() => {
  const byDay = new Map<string, number>();
  for (const e of activity.events) {
    const k = dayKey(new Date(e.ts));
    byDay.set(k, (byDay.get(k) ?? 0) + 1);
  }
  const cells: { key: string; n: number; level: number; label: string }[] = [];
  const today = new Date();
  for (let i = HEAT_DAYS - 1; i >= 0; i -= 1) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const n = byDay.get(dayKey(d)) ?? 0;
    const level = n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 6 ? 3 : 4;
    cells.push({
      key: dayKey(d),
      n,
      level,
      label: `${d.toLocaleDateString(locale.value === 'zh' ? 'zh-CN' : 'en-US')} · ${n}`
    });
  }
  return cells;
});

// ── Recent history ───────────────────────────────────
const recent = computed(() => [...activity.events].reverse().slice(0, 12));

function relTime(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return t('time.justNow');
  if (s < 3600) return t('time.minAgo', { n: Math.floor(s / 60) });
  if (s < 86_400) return t('time.hourAgo', { n: Math.floor(s / 3600) });
  if (s < 86_400 * 30) return t('time.dayAgo', { n: Math.floor(s / 86_400) });
  return new Date(ts).toLocaleDateString(locale.value === 'zh' ? 'zh-CN' : 'en-US');
}

function toolLabel(tool: string): string {
  const meta = TOOL_META[tool];
  return meta ? t(meta.labelKey) : tool;
}

function openTool(tool: string) {
  window.location.hash = `#/${tool}`;
}

// ── Actions ──────────────────────────────────────────
async function doChangePassword() {
  if (await auth.changePassword(oldPass.value, newPass.value)) {
    oldPass.value = '';
    newPass.value = '';
  }
}

function doClearFileRecords() {
  if (window.confirm(t('profile.clearConfirm'))) void fileRecords.clearAll();
}

function doClearHistory() {
  if (window.confirm(t('profile.clearConfirm'))) activity.clearHistory();
}

function doExport() {
  const user = auth.currentUser;
  if (!user) return;
  const payload = {
    exportedAt: new Date().toISOString(),
    account: { username: user.username, email: user.email, createdAt: user.createdAt },
    history: activity.events
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dot-matrix-studio-data.json';
  a.click();
  URL.revokeObjectURL(url);
}

function goLogin() {
  window.location.hash = '#/user';
}

function doLogout() {
  auth.logout();
  window.location.hash = '#/';
}

async function doDelete() {
  if (!window.confirm(t('auth.deleteConfirm'))) return;
  const uid = auth.currentUser?.id;
  if (!(await auth.deleteAccount(deletePass.value))) return;
  // 只有在服务端确认删除后才清本地数据（密码错误时不应丢失本地记录）。
  if (uid) {
    activity.purgeUser(uid);
    void dbDeleteAiConfig(uid);
  }
  window.location.hash = '#/';
}
</script>

<template>
  <div class="auth-page">
    <Panel v-if="!auth.currentUser" :title="t('auth.profile')">
      <div class="empty-state" style="padding: 24px 0">
        <span class="big">◉</span>
        <span>{{ t('auth.needLogin') }}</span>
        <button class="btn primary" data-test="go-login" @click="goLogin">
          {{ t('auth.login') }}
        </button>
      </div>
    </Panel>

    <div v-else class="profile-grid">
      <!-- Identity + stat tiles -->
      <Panel :title="t('auth.profile')" class="col-full">
        <div class="profile-identity">
          <div class="profile-identity-main">
            <div class="profile-avatar" data-test="profile-avatar" :style="avatarStyle">
              {{ avatarCharFor(auth.currentUser.username) }}
            </div>
            <div class="profile-meta">
              <div v-if="!editingName" class="profile-name-row">
                <b data-test="profile-name">{{ auth.currentUser.username }}</b>
                <button class="btn sm" data-test="rename-start" @click="startRename">
                  {{ t('profile.editName') }}
                </button>
              </div>
              <div v-else class="profile-name-row">
                <input
                  v-model="nameDraft"
                  class="rename-input"
                  data-test="rename-input"
                  maxlength="20"
                  @keyup.enter="saveRename"
                />
                <button class="btn sm primary" data-test="rename-save" @click="saveRename">
                  {{ t('profile.saveName') }}
                </button>
                <button class="btn sm" data-test="rename-cancel" @click="editingName = false">
                  {{ t('profile.cancel') }}
                </button>
              </div>
              <div class="profile-info-line">
                <span>{{ auth.currentUser.email }}</span>
                <span class="dot"></span>
                <span>{{ t('auth.joined') }} {{ joined }}</span>
              </div>
              <div v-if="!editingBio" class="profile-bio">
                <span v-if="auth.currentUser?.bio" class="bio-text">{{ auth.currentUser.bio }}</span>
                <span v-else class="bio-placeholder">{{ t('profile.bioPlaceholder') }}</span>
                <button class="btn sm bio-edit-btn" @click="startEditBio">编辑</button>
              </div>
              <div v-else class="profile-bio-edit">
                <input
                  v-model="bioDraft"
                  class="bio-input"
                  maxlength="200"
                  :placeholder="t(`profile.bioHint`)"
                  @keyup.enter="saveBio"
                  @keyup.esc="cancelEditBio"
                />
                <div class="bio-actions">
                  <span class="bio-count">{{ bioDraft.length }}/200</span>
                  <button class="btn sm" @click="cancelEditBio">取消</button>
                  <button class="btn sm primary" @click="saveBio">保存</button>
                </div>
              </div>
            </div>
          </div>
          <div class="profile-stats">
            <div class="stat-card" data-test="stat-total">
              <b>{{ totalUses }}</b><span>{{ t('profile.statTotal') }}</span>
            </div>
            <div class="stat-card" data-test="stat-days">
              <b>{{ memberDays }}</b><span>{{ t('profile.statDays') }}</span>
            </div>
            <div class="stat-card" data-test="stat-favorite">
              <b>{{ favoriteTool ? TOOL_META[favoriteTool].icon : '—' }}</b>
              <span>{{ favoriteTool ? toolLabel(favoriteTool) : t('profile.statFavorite') }}</span>
            </div>
            <div class="stat-card" data-test="stat-tried">
              <b>{{ toolsTried }}<em>/8</em></b><span>{{ t('profile.statTried') }}</span>
            </div>
          </div>
        </div>
        <div v-if="auth.authError" class="alert-error" data-test="auth-error" style="margin-top:10px">{{ auth.authError }}</div>
        <p class="profile-note" style="margin-top:8px">{{ t('auth.watermarkNote') }}</p>
      </Panel>

      <!-- Pixel heatmap -->
      <Panel :title="t('profile.heatmap')" class="col-heat">
        <div class="heatmap-wrap"><div class="heatmap" data-test="heatmap">
          <span
            v-for="cell in heatmap"
            :key="cell.key"
            class="heat-cell"
            :class="`l${cell.level}`"
            :title="cell.label"
          ></span>
        </div></div>
        <div class="heat-legend">
          <span>{{ t('profile.heatLess') }}</span>
          <span class="heat-cell l0"></span>
          <span class="heat-cell l1"></span>
          <span class="heat-cell l2"></span>
          <span class="heat-cell l3"></span>
          <span class="heat-cell l4"></span>
          <span>{{ t('profile.heatMore') }}</span>
        </div>
      </Panel>

      <!-- Tool usage distribution -->
      <Panel :title="t('profile.usage')" class="col-usage">
        <div v-if="usageRows.length" class="usage-list" data-test="usage-list">
          <button
            v-for="row in usageRows"
            :key="row.tool"
            class="usage-row"
            :title="t('home.launch')"
            @click="openTool(row.tool)"
          >
            <span class="usage-icon">{{ TOOL_META[row.tool].icon }}</span>
            <span class="usage-name">{{ toolLabel(row.tool) }}</span>
            <span class="usage-pixel-bar">
              <span
                v-for="n in 25"
                :key="n"
                class="usage-pixel"
                :class="{ active: n <= Math.ceil(row.pct / (100/25)), full: n <= Math.floor(row.pct / (100/25)) }"
              ></span>
            </span>
            <span class="usage-count">{{ row.n }}</span>
          </button>
        </div>
        <p v-else class="profile-empty" data-test="usage-empty">{{ t('profile.empty') }}</p>
      </Panel>

            <!-- Recent activity -->
      <Panel :title="t('profile.recent')" class="col-half">
        <template #actions>
          <button
            v-if="activity.events.length"
            class="btn sm"
            data-test="clear-history"
            @click="doClearHistory"
          >
            {{ t('profile.clear') }}
          </button>
        </template>
        <div v-if="activity.syncWarning" class="auth-notice" data-test="activity-sync-warning">
          <span>{{ activity.syncWarning }}</span>
          <button class="btn sm" type="button" data-test="activity-sync-retry" @click="activity.retrySync()">
            {{ t('activity.retry') }}
          </button>
        </div>
        <ul v-if="recent.length" class="recent-list" data-test="recent-list">
          <li v-for="(e, i) in recent" :key="`${e.ts}-${i}`" class="recent-row">
            <span class="usage-icon">{{ TOOL_META[e.tool]?.icon ?? '·' }}</span>
            <span class="usage-name">{{ toolLabel(e.tool) }}</span>
            <span class="recent-time">{{ relTime(e.ts) }}</span>
          </li>
        </ul>
        <p v-else class="profile-empty" data-test="recent-empty">{{ t('profile.empty') }}</p>
      </Panel>

      <!-- File records -->
      <Panel :title="t(`profile.fileRecords`)" class="col-half">
        <template #actions>
          <button
            v-if="fileRecords.records.length"
            class="btn sm"
            @click="doClearFileRecords"
          >
            {{ t('profile.clear') }}
          </button>
        </template>
        <ul v-if="fileRecords.records.length" class="recent-list">
          <li
            v-for="record in fileRecords.records.slice(0, 12)"
            :key="record.id"
            class="recent-row"
            :title="record.fileName"
          >
            <span class="usage-icon">{{ TOOL_META[record.tool]?.icon ?? '·' }}</span>
            <span class="usage-name" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:55%">
              {{ record.fileName }}
            </span>
            <span class="recent-time">{{ relTime(record.createdAt) }}</span>
          </li>
        </ul>
        <p v-else class="profile-empty">{{ t('profile.noFiles') }}</p>
      </Panel>

      <!-- Security -->
      <Panel :title="t('auth.changePass')" class="col-half">
        <form class="field-stack" @submit.prevent="doChangePassword">
          <label class="field">
            <span>{{ t('auth.oldPass') }}</span>
            <input v-model="oldPass" type="password" data-test="old-pass" autocomplete="current-password" />
          </label>
          <label class="field">
            <span>{{ t('auth.newPass') }}</span>
            <input v-model="newPass" type="password" data-test="new-pass" autocomplete="new-password" />
          </label>
          <div v-if="auth.authError" class="alert-error" data-test="pass-error">{{ auth.authError }}</div>
          <div v-else-if="auth.notice" class="auth-notice" data-test="auth-notice">{{ auth.notice }}</div>
          <button class="btn" type="submit" data-test="change-pass" :disabled="!oldPass || !newPass">
            {{ t('auth.changePass') }}
          </button>
        </form>
      </Panel>

      <!-- Account actions -->
      <Panel :title="t('auth.accountActions')" class="col-half">
        <div class="profile-actions">
          <button class="btn" data-test="export-data" @click="doExport">{{ t('profile.export') }}</button>
          <button class="btn" data-test="logout" @click="doLogout">{{ t('auth.logout') }}</button>
          <button class="btn danger" data-test="delete-account" :disabled="!deletePass" @click="doDelete">{{ t('auth.deleteAccount') }}</button>
          <label class="field" style="flex-basis:100%">
            <span>{{ t('auth.deletePass') }}</span>
            <input v-model="deletePass" type="password" data-test="delete-pass" autocomplete="current-password" />
          </label>
          <div v-if="auth.authError" class="alert-error" data-test="delete-error">{{ auth.authError }}</div>
          <span class="profile-note profile-actions-note">{{ t('profile.exportNote') }}</span>
        </div>
      </Panel>
    </div>
  </div>
</template>