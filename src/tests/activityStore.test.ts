import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '../user/authStore';
import { TOOL_META, useActivityStore } from '../user/activityStore';

function mockMailApi() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      new Response(JSON.stringify({ success: true, message: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    )
  );
}

async function registerUser(username = 'alice', email = 'alice@example.com') {
  const auth = useAuthStore();
  await auth.register({ username, email, password: 'secret123', confirm: 'secret123', code: '1' });
  return auth;
}

describe('activityStore', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    mockMailApi();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('ignores events while logged out and unknown tools', async () => {
    const activity = useActivityStore();
    activity.record('image');
    expect(activity.events).toHaveLength(0);

    await registerUser();
    activity.record('not-a-tool');
    expect(activity.events).toHaveLength(0);
  });

  it('records visits, dedupes within a minute, persists per user', async () => {
    vi.useFakeTimers();
    await registerUser();
    const activity = useActivityStore();

    activity.record('image');
    activity.record('image'); // deduped
    expect(activity.events).toHaveLength(1);

    vi.advanceTimersByTime(61_000);
    activity.record('image'); // new use after the window
    activity.record('font'); // different tool always counts
    expect(activity.events).toHaveLength(3);
    expect(JSON.parse(localStorage.getItem('dms-activity')!)).toBeTruthy();
  });

  it('separates history between users', async () => {
    vi.useFakeTimers();
    const auth = await registerUser();
    const activity = useActivityStore();
    activity.record('image');

    auth.logout();
    vi.advanceTimersByTime(61_000);
    await registerUser('bob', 'bob@example.com');
    expect(activity.events).toHaveLength(0);
    activity.record('audio');
    expect(activity.events).toHaveLength(1);
    expect(activity.events[0].tool).toBe('audio');

    await auth.login('alice', 'secret123');
    expect(activity.events).toHaveLength(1);
    expect(activity.events[0].tool).toBe('image');
  });

  it('caps stored events at 500', async () => {
    vi.useFakeTimers();
    await registerUser();
    const activity = useActivityStore();
    const tools = Object.keys(TOOL_META);
    for (let i = 0; i < 520; i += 1) {
      activity.record(tools[i % tools.length]);
      vi.advanceTimersByTime(500);
    }
    expect(activity.events.length).toBeLessThanOrEqual(500);
  });

  it('clearHistory and purgeUser empty the log', async () => {
    const auth = await registerUser();
    const activity = useActivityStore();
    activity.record('image');
    activity.clearHistory();
    expect(activity.events).toHaveLength(0);

    activity.record('video');
    const uid = auth.currentUser!.id;
    activity.purgeUser(uid);
    expect(activity.events).toHaveLength(0);
  });
});
