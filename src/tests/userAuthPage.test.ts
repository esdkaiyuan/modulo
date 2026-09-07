import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { nextTick } from 'vue';
import AuthShowcase from '../components/AuthShowcase.vue';
import UserAuthPage from '../pages/UserAuthPage.vue';
import { locale } from '../i18n';
import { hashPassword } from '../user/passwordHash';

let wrapper: VueWrapper | null = null;

function mountAuthPage() {
  wrapper = mount(UserAuthPage, {
    global: { plugins: [createPinia()] }
  });
  return wrapper;
}

beforeEach(() => {
  localStorage.clear();
  locale.value = 'en';
  window.location.hash = '#/user';
});

afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('UserAuthPage', () => {
  it('shows neutral, invalid, and valid registration field hints', async () => {
    const page = mountAuthPage();
    await page.get('[data-test="tab-register"]').trigger('click');

    for (const field of ['username', 'email', 'code', 'pass', 'confirm']) {
      expect(page.get(`[data-test="hint-${field}"]`).classes()).not.toContain('bad');
      expect(page.get(`[data-test="hint-${field}"]`).classes()).not.toContain('ok');
    }

    await page.get('[data-test="reg-username"]').setValue('a');
    await page.get('[data-test="reg-email"]').setValue('bad-email');
    await page.get('[data-test="reg-code"]').setValue('12');
    await page.get('[data-test="reg-pass"]').setValue('123');
    await page.get('[data-test="reg-confirm"]').setValue('456');

    for (const field of ['username', 'email', 'code', 'pass', 'confirm']) {
      expect(page.get(`[data-test="hint-${field}"]`).classes()).toContain('bad');
    }
    expect(page.get('[data-test="hint-username"]').text()).toContain('2–20');
    expect(page.get('[data-test="hint-email"]').text()).toContain('valid email');
    expect(page.get('[data-test="hint-pass"]').text()).toContain('at least 6');
    expect(page.get('[data-test="hint-confirm"]').text()).toContain('do not match');

    await page.get('[data-test="reg-username"]').setValue('Alice');
    await page.get('[data-test="reg-email"]').setValue('alice@example.com');
    await page.get('[data-test="reg-code"]').setValue('123456');
    await page.get('[data-test="reg-pass"]').setValue('secret123');
    await page.get('[data-test="reg-confirm"]').setValue('secret123');

    for (const field of ['username', 'email', 'code', 'pass', 'confirm']) {
      expect(page.get(`[data-test="hint-${field}"]`).classes()).toContain('ok');
    }
  });

  it('reports verification-code success and starts the resend countdown', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ success: true, message: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const page = mountAuthPage();
    await page.get('[data-test="tab-register"]').trigger('click');
    await page.get('[data-test="reg-email"]').setValue('alice@example.com');
    await page.get('[data-test="reg-send-code"]').trigger('click');
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledWith(
      '/mailapi/send-code',
      expect.objectContaining({ method: 'POST' })
    );
    expect(page.get('[data-test="auth-notice"]').text()).toContain('sent');
    expect(page.get('[data-test="reg-send-code"]').text()).toContain('60');

    vi.advanceTimersByTime(1000);
    await nextTick();
    expect(page.get('[data-test="reg-send-code"]').text()).toContain('59');
  });

  it('shows a login error and then signs in an existing account', async () => {
    const salt = 'fixed-salt';
    const user = {
      id: 'u-existing',
      username: 'Alice',
      email: 'alice@example.com',
      passHash: await hashPassword('secret123', salt),
      salt,
      createdAt: 1
    };
    localStorage.setItem('dms-users', JSON.stringify([user]));
    const page = mountAuthPage();

    await page.get('[data-test="login-id"]').setValue('alice@example.com');
    await page.get('[data-test="login-pass"]').setValue('wrong-pass');
    expect(page.get('[data-test="login-submit"]').attributes('disabled')).toBeUndefined();
    await page.get('form').trigger('submit');
    await vi.waitFor(() => {
      expect(page.get('[data-test="auth-error"]').text()).toContain('Wrong password');
    });

    await page.get('[data-test="login-pass"]').setValue('secret123');
    await page.get('form').trigger('submit');
    await vi.waitFor(() => {
      expect(localStorage.getItem('dms-session')).toBe(user.id);
      expect(window.location.hash).toBe('#/profile');
    });
  });

  it('registers a valid account through the verification endpoint', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ success: true, message: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const page = mountAuthPage();
    await page.get('[data-test="tab-register"]').trigger('click');
    await page.get('[data-test="reg-username"]').setValue('Alice');
    await page.get('[data-test="reg-email"]').setValue('alice@example.com');
    await page.get('[data-test="reg-code"]').setValue('123456');
    await page.get('[data-test="reg-pass"]').setValue('secret123');
    await page.get('[data-test="reg-confirm"]').setValue('secret123');
    await page.get('form').trigger('submit');

    await vi.waitFor(() => {
      const users = JSON.parse(localStorage.getItem('dms-users') ?? '[]');
      expect(users).toHaveLength(1);
      expect(users[0]).toMatchObject({ username: 'Alice', email: 'alice@example.com' });
      expect(users[0].passHash).not.toBe('secret123');
      expect(localStorage.getItem('dms-session')).toBe(users[0].id);
      expect(window.location.hash).toBe('#/profile');
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/mailapi/verify-code',
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('AuthShowcase', () => {
  it('cycles automatically, supports manual selection, and clears its timer', async () => {
    vi.useFakeTimers();
    wrapper = mount(AuthShowcase);

    expect(wrapper.get('[data-test="showcase-caption"]').text()).toBe('Image Converter');
    expect(vi.getTimerCount()).toBe(1);

    vi.advanceTimersByTime(3500);
    await nextTick();
    expect(wrapper.get('[data-test="showcase-caption"]').text()).toBe('Video Extractor');

    await wrapper.get('[data-test="showcase-dot-handdraw"]').trigger('click');
    expect(wrapper.get('[data-test="showcase-caption"]').text()).toBe('Pixel Editor');
    expect(vi.getTimerCount()).toBe(1);

    wrapper.unmount();
    wrapper = null;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('starts and stops the canvas animation loop when motion is allowed', () => {
    const requestFrame = vi.fn<(callback: FrameRequestCallback) => number>(() => 17);
    const cancelFrame = vi.fn<(handle: number) => void>();
    vi.stubGlobal('requestAnimationFrame', requestFrame);
    vi.stubGlobal('cancelAnimationFrame', cancelFrame);
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => true)
    });

    wrapper = mount(AuthShowcase);
    expect(wrapper.get('canvas').attributes('aria-label')).toBe('image demo animation');
    expect(requestFrame).toHaveBeenCalledTimes(1);

    const firstFrame = requestFrame.mock.calls[0][0];
    firstFrame(1000);
    expect(requestFrame).toHaveBeenCalledTimes(2);

    wrapper.unmount();
    wrapper = null;
    expect(cancelFrame).toHaveBeenCalledWith(17);
  });
});
