import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { useAuthStore } from './authStore';
import { dbAddActivity, dbClearActivity, dbGetActivity } from './localDb';
import type { MessageKey } from '../i18n/messages';

/** One usage event: a tool page opened by the logged-in user. */
export interface ActivityEvent {
  tool: string;
  ts: number;
}

export const TOOL_META: Record<string, { icon: string; labelKey: MessageKey }> = {
  image: { icon: '▣', labelKey: 'nav.image' },
  video: { icon: '▶', labelKey: 'nav.video' },
  animation: { icon: '◧', labelKey: 'nav.animation' },
  font: { icon: '字', labelKey: 'nav.font' },
  batch: { icon: '≣', labelKey: 'nav.batch' },
  handdraw: { icon: '✎', labelKey: 'nav.handdraw' },
  audio: { icon: '♪', labelKey: 'nav.audio' },
  bead: { icon: '◎', labelKey: 'nav.bead' },
  ai: { icon: '✦', labelKey: 'nav.ai' }
};

const KEY = 'dms-activity';
const CAP = 500; // events kept per user
const DEDUPE_MS = 60_000; // re-opening the same tool within a minute is one use

function loadAll(): Record<string, ActivityEvent[]> {
  try {
    const raw = localStorage.getItem(KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return obj && typeof obj === 'object' ? obj : {};
  } catch {
    return {};
  }
}

export const useActivityStore = defineStore('activity', () => {
  const auth = useAuthStore();
  const all = ref<Record<string, ActivityEvent[]>>(loadAll());

  /** Events of the logged-in user, oldest first. */
  const events = computed<ActivityEvent[]>(() =>
    auth.currentUser ? (all.value[auth.currentUser.id] ?? []) : []
  );

  function persist() {
    localStorage.setItem(KEY, JSON.stringify(all.value));
  }

  // Rehydrate the logged-in user's history from the durable database when the
  // localStorage cache lost it (e.g. site data partially cleared).
  watch(
    () => auth.currentUser?.id,
    (uid) => {
      if (!uid || (all.value[uid]?.length ?? 0) > 0) return;
      void dbGetActivity(uid).then((rows) => {
        if (rows.length === 0) return;
        const restored = rows.map(({ tool, ts }) => ({ tool, ts })).slice(-CAP);
        all.value = { ...all.value, [uid]: restored };
        persist();
      });
    },
    { immediate: true }
  );

  /** Record a tool visit for the current user (deduped, capped). */
  function record(tool: string) {
    const user = auth.currentUser;
    if (!user || !(tool in TOOL_META)) return;
    const list = all.value[user.id] ?? [];
    const last = list[list.length - 1];
    if (last && last.tool === tool && Date.now() - last.ts < DEDUPE_MS) return;
    const event = { tool, ts: Date.now() };
    all.value = { ...all.value, [user.id]: [...list, event].slice(-CAP) };
    persist();
    // Mirror the single row into IndexedDB (best-effort, async).
    void dbAddActivity({ id: `${user.id}:${event.ts}:${list.length}`, userId: user.id, ...event });
  }

  /** Wipe the current user's history. */
  function clearHistory() {
    const user = auth.currentUser;
    if (!user) return;
    const { [user.id]: _gone, ...rest } = all.value;
    all.value = rest;
    persist();
    void dbClearActivity(user.id);
  }

  /** Remove a specific user's history (used when deleting the account). */
  function purgeUser(userId: string) {
    void dbClearActivity(userId);
    if (!(userId in all.value)) return;
    const { [userId]: _gone, ...rest } = all.value;
    all.value = rest;
    persist();
  }

  return { events, record, clearHistory, purgeUser };
});
