import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { avatarCharFor, avatarHueFor, useAuthStore } from '../user/authStore';
import { hashPassword } from '../user/passwordHash';
import { watermarkUserId } from '../user/identity';

function mockMailApi(success: boolean, message = success ? 'ok' : '验证码无效') {
  const fn = vi.fn(async () =>
    new Response(JSON.stringify({ success, message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  );
  vi.stubGlobal('fetch', fn);
  return fn;
}

const REG_INPUT = {
  username: 'alice',
  email: 'alice@example.com',
  password: 'secret123',
  confirm: 'secret123',
  code: '123456'
};

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('hashPassword is deterministic and salt-sensitive', async () => {
    const a = await hashPassword('pw', 'salt1');
    expect(await hashPassword('pw', 'salt1')).toBe(a);
    expect(await hashPassword('pw', 'salt2')).not.toBe(a);
    expect(await hashPassword('other', 'salt1')).not.toBe(a);
  });

  it('registers after code verification, logs in, persists and binds watermark', async () => {
    const fetchMock = mockMailApi(true);
    const store = useAuthStore();

    expect(await store.register(REG_INPUT)).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      '/mailapi/verify-code',
      expect.objectContaining({ method: 'POST' })
    );
    expect(store.currentUser?.username).toBe('alice');
    expect(watermarkUserId.value).toBe('alice');
    expect(JSON.parse(localStorage.getItem('dms-users')!)).toHaveLength(1);
    // password is not stored in plaintext
    expect(localStorage.getItem('dms-users')).not.toContain('secret123');

    store.logout();
    expect(store.currentUser).toBeNull();
    expect(watermarkUserId.value).toBe('guest');

    expect(await store.login('ALICE', 'wrong-pass')).toBe(false);
    expect(store.authError).not.toBe('');
    expect(await store.login('alice@example.com', 'secret123')).toBe(true);
    expect(store.currentUser?.email).toBe('alice@example.com');
  });

  it('restores the session from localStorage on store creation', async () => {
    mockMailApi(true);
    const store = useAuthStore();
    await store.register(REG_INPUT);

    setActivePinia(createPinia());
    const fresh = useAuthStore();
    expect(fresh.currentUser?.username).toBe('alice');
  });

  it('rejects registration when the service refuses the code', async () => {
    mockMailApi(false, '验证码无效或已过期，请重新获取');
    const store = useAuthStore();
    expect(await store.register(REG_INPUT)).toBe(false);
    expect(store.authError).toContain('验证码无效');
    expect(store.currentUser).toBeNull();
  });

  it('validates input before hitting the network', async () => {
    const fetchMock = mockMailApi(true);
    const store = useAuthStore();

    expect(await store.register({ ...REG_INPUT, username: 'a' })).toBe(false);
    expect(await store.register({ ...REG_INPUT, email: 'nope' })).toBe(false);
    expect(await store.register({ ...REG_INPUT, password: '123', confirm: '123' })).toBe(false);
    expect(await store.register({ ...REG_INPUT, confirm: 'different' })).toBe(false);
    expect(await store.register({ ...REG_INPUT, code: ' ' })).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();

    expect(await store.requestCode('not-an-email')).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('blocks duplicate username and email', async () => {
    mockMailApi(true);
    const store = useAuthStore();
    await store.register(REG_INPUT);
    store.logout();

    expect(
      await store.register({ ...REG_INPUT, email: 'other@example.com' })
    ).toBe(false); // same username
    expect(
      await store.register({ ...REG_INPUT, username: 'bob' })
    ).toBe(false); // same email
    expect(await store.requestCode('alice@example.com')).toBe(false);
  });

  it('send-code starts a cooldown', async () => {
    vi.useFakeTimers();
    const fetchMock = mockMailApi(true);
    const store = useAuthStore();

    expect(await store.requestCode('new@example.com')).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith('/mailapi/send-code', expect.anything());
    expect(store.codeCooldown).toBe(60);
    expect(await store.requestCode('new@example.com')).toBe(false); // cooldown blocks
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(61_000);
    expect(store.codeCooldown).toBe(0);
  });

  it('changes password and rejects the old one afterwards', async () => {
    mockMailApi(true);
    const store = useAuthStore();
    await store.register(REG_INPUT);

    expect(await store.changePassword('wrong', 'newpass123')).toBe(false);
    expect(await store.changePassword('secret123', 'newpass123')).toBe(true);
    store.logout();
    expect(await store.login('alice', 'secret123')).toBe(false);
    expect(await store.login('alice', 'newpass123')).toBe(true);
  });

  it('deleteAccount removes the user and unbinds the watermark', async () => {
    mockMailApi(true);
    const store = useAuthStore();
    await store.register(REG_INPUT);
    store.deleteAccount();
    expect(store.currentUser).toBeNull();
    expect(JSON.parse(localStorage.getItem('dms-users')!)).toHaveLength(0);
    expect(watermarkUserId.value).toBe('guest');
    expect(localStorage.getItem('dms-session')).toBeNull();
  });

  it('avatar helpers use the first character and a stable hue', () => {
    expect(avatarCharFor('alice')).toBe('A');
    expect(avatarCharFor('张三')).toBe('张');
    expect(avatarCharFor('  ')).toBe('?');
    expect(avatarHueFor('alice')).toBe(avatarHueFor('alice'));
    expect(avatarHueFor('alice')).toBeGreaterThanOrEqual(0);
    expect(avatarHueFor('alice')).toBeLessThan(360);
  });

  it('route guard remembers the blocked route and consumes it once', () => {
    const store = useAuthStore();
    store.requireLogin('font');
    expect(store.redirectTarget).toBe('font');
    expect(store.notice).not.toBe('');
    expect(store.consumeRedirect()).toBe('font');
    expect(store.consumeRedirect()).toBeNull();
  });
});
