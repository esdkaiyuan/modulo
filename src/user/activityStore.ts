import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { t } from '../i18n';
import type { MessageKey } from '../i18n/messages';
import { useAuthStore } from './authStore';
import { request } from './serverApi';

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

const CAP = 500;
const DEDUPE_MS = 60_000;

interface ServerActivityEvent {
  id: string;
  tool: string;
  ts: number;
}

interface ActivityResponse {
  events: ServerActivityEvent[];
}

interface ActivityRecordResponse {
  event: ServerActivityEvent;
}

interface MutationTask {
  kind: 'record' | 'clear';
  run: () => Promise<boolean>;
}

interface MutationQueue {
  running: boolean;
  halted: boolean;
  tasks: MutationTask[];
  drainPromise: Promise<void> | null;
}

export function isAllowedTool(value: unknown): value is string {
  return typeof value === 'string' && Object.hasOwn(TOOL_META, value);
}

function isServerEvent(value: unknown): value is ServerActivityEvent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const event = value as Record<string, unknown>;
  return typeof event.id === 'string'
    && isAllowedTool(event.tool)
    && typeof event.ts === 'number'
    && Number.isFinite(event.ts);
}

function isActivityResponse(value: unknown): value is ActivityResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const events = (value as { events?: unknown }).events;
  return Array.isArray(events) && events.every(isServerEvent);
}

function isActivityRecordResponse(value: unknown): value is ActivityRecordResponse {
  return !!value
    && typeof value === 'object'
    && !Array.isArray(value)
    && isServerEvent((value as { event?: unknown }).event);
}

function capped(events: ActivityEvent[]): ActivityEvent[] {
  return events.slice(-CAP);
}

function mergeLoadedEvents(loaded: ActivityEvent[], current: ActivityEvent[]): ActivityEvent[] {
  const merged = [...loaded, ...current].sort((left, right) => left.ts - right.ts);
  const deduped: ActivityEvent[] = [];
  for (const event of merged) {
    const previous = deduped[deduped.length - 1];
    if (previous && previous.tool === event.tool && event.ts - previous.ts < DEDUPE_MS) continue;
    deduped.push(event);
  }
  return capped(deduped);
}

export const useActivityStore = defineStore('activity', () => {
  const auth = useAuthStore();
  const events = ref<ActivityEvent[]>([]);
  const warningKey = ref<MessageKey | null>(null);
  const syncWarning = computed(() => warningKey.value ? t(warningKey.value) : '');

  let activeUserId: string | null = null;
  let generation = 0;
  let loadToken = 0;
  let memoryRevision = 0;
  let recordEpoch = 0;
  let loadFailed = false;
  let mutationQueue: MutationQueue = {
    running: false,
    halted: false,
    tasks: [],
    drainPromise: null
  };

  function isCurrent(expectedGeneration: number, userId: string): boolean {
    return generation === expectedGeneration
      && activeUserId === userId
      && auth.status === 'authenticated'
      && auth.currentUser?.id === userId;
  }

  function updateWarning() {
    warningKey.value = loadFailed || mutationQueue.halted ? 'activity.syncFailed' : null;
  }

  async function drainMutations(queue: MutationQueue): Promise<void> {
    if (queue.drainPromise) return queue.drainPromise;
    const run = (async () => {
      queue.running = true;
      while (!queue.halted && queue.tasks.length > 0) {
        const succeeded = await queue.tasks[0].run();
        if (!succeeded) {
          queue.halted = true;
          if (mutationQueue === queue) updateWarning();
          return;
        }
        queue.tasks.shift();
      }
      if (mutationQueue === queue) updateWarning();
    })();
    queue.drainPromise = run;
    try {
      await run;
    } finally {
      queue.running = false;
      if (queue.drainPromise === run) queue.drainPromise = null;
    }
  }

  async function enqueueMutation(task: MutationTask): Promise<void> {
    const queue = mutationQueue;
    queue.tasks.push(task);
    if (queue.halted) return;
    await drainMutations(queue);
  }

  function resetMutationQueue() {
    mutationQueue.halted = true;
    mutationQueue.tasks = [];
    mutationQueue = {
      running: false,
      halted: false,
      tasks: [],
      drainPromise: null
    };
  }

  async function performLoad(
    expectedGeneration: number,
    userId: string,
    expectedLoadToken: number,
    startRevision: number
  ): Promise<void> {
    try {
      const response = await request<ActivityResponse>('/api/me/activity', { validate: isActivityResponse });
      if (!isCurrent(expectedGeneration, userId) || loadToken !== expectedLoadToken) return;
      const loaded = capped(response.events.map(({ tool, ts }) => ({ tool, ts })));
      events.value = memoryRevision === startRevision
        ? loaded
        : mergeLoadedEvents(loaded, events.value);
      loadFailed = false;
      updateWarning();
    } catch {
      if (loadToken !== expectedLoadToken) return;
      if (!isCurrent(expectedGeneration, userId)) return;
      loadFailed = true;
      updateWarning();
    }
  }

  async function load(): Promise<void> {
    const userId = activeUserId;
    const expectedGeneration = generation;
    if (!userId || !isCurrent(expectedGeneration, userId)) return;
    const expectedLoadToken = ++loadToken;
    const startRevision = memoryRevision;
    await performLoad(expectedGeneration, userId, expectedLoadToken, startRevision);
  }

  async function performRecord(
    tool: string,
    expectedGeneration: number,
    userId: string,
    expectedRecordEpoch: number
  ): Promise<boolean> {
    try {
      await request<ActivityRecordResponse>('/api/me/activity', {
        method: 'POST',
        body: { tool },
        validate: isActivityRecordResponse
      });
      return true;
    } catch {
      if (!isCurrent(expectedGeneration, userId) || recordEpoch !== expectedRecordEpoch) return true;
      return false;
    }
  }

  async function record(tool: string): Promise<void> {
    const userId = activeUserId;
    const expectedGeneration = generation;
    if (!userId || !isCurrent(expectedGeneration, userId) || !isAllowedTool(tool)) return;
    const previous = events.value[events.value.length - 1];
    const now = Date.now();
    if (previous && previous.tool === tool && now - previous.ts < DEDUPE_MS) return;

    events.value = capped([...events.value, { tool, ts: now }]);
    memoryRevision += 1;
    const expectedRecordEpoch = recordEpoch;
    await enqueueMutation({
      kind: 'record',
      run: async () => {
        if (!isCurrent(expectedGeneration, userId) || recordEpoch !== expectedRecordEpoch) return true;
        return performRecord(tool, expectedGeneration, userId, expectedRecordEpoch);
      }
    });
  }

  async function performClear(expectedGeneration: number, userId: string): Promise<boolean> {
    try {
      await request<void>('/api/me/activity', { method: 'DELETE' });
      return true;
    } catch {
      return !isCurrent(expectedGeneration, userId);
    }
  }

  function clearTask(expectedGeneration: number, userId: string): MutationTask {
    return {
      kind: 'clear',
      run: async () => {
        if (!isCurrent(expectedGeneration, userId)) return true;
        return performClear(expectedGeneration, userId);
      }
    };
  }

  async function replaceQueueWithClear(expectedGeneration: number, userId: string): Promise<void> {
    const queue = mutationQueue;
    const currentTask = queue.running ? queue.tasks[0] : undefined;
    queue.tasks = currentTask
      ? [currentTask, clearTask(expectedGeneration, userId)]
      : [clearTask(expectedGeneration, userId)];
    queue.halted = false;
    updateWarning();
    await drainMutations(queue);
  }

  async function retryFailedClear(expectedGeneration: number, userId: string): Promise<void> {
    const queue = mutationQueue;
    queue.tasks = [...queue.tasks.slice(1), clearTask(expectedGeneration, userId)];
    queue.halted = false;
    updateWarning();
    await drainMutations(queue);
  }

  async function clearHistory(): Promise<void> {
    const userId = activeUserId;
    const expectedGeneration = generation;
    if (!userId || !isCurrent(expectedGeneration, userId)) return;
    loadToken += 1;
    memoryRevision += 1;
    recordEpoch += 1;
    events.value = [];
    await replaceQueueWithClear(expectedGeneration, userId);
  }

  async function purgeUser(userId: string): Promise<void> {
    if (userId !== activeUserId) return;
    await clearHistory();
  }

  async function retrySync(): Promise<void> {
    const userId = activeUserId;
    const expectedGeneration = generation;
    if (!userId || !isCurrent(expectedGeneration, userId)) return;
    if (loadFailed) {
      await load();
    }
    const queue = mutationQueue;
    if (!queue.halted) return;
    if (queue.tasks[0]?.kind === 'clear') {
      loadToken += 1;
      memoryRevision += 1;
      events.value = [];
      await retryFailedClear(expectedGeneration, userId);
    } else {
      queue.halted = false;
      await drainMutations(queue);
    }
  }

  watch(
    () => auth.status === 'authenticated' ? auth.currentUser?.id ?? null : null,
    (userId) => {
      generation += 1;
      loadToken += 1;
      memoryRevision += 1;
      recordEpoch += 1;
      activeUserId = userId;
      events.value = [];
      loadFailed = false;
      warningKey.value = null;
      resetMutationQueue();
      if (userId) void load();
    },
    { immediate: true, flush: 'sync' }
  );

  return { events, syncWarning, load, record, clearHistory, purgeUser, retrySync };
});
