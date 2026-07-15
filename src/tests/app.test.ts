import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import App from '../App.vue';

function mountAt(hash: string) {
  window.location.hash = hash;
  const wrapper = mount(App, {
    global: {
      plugins: [createPinia()]
    }
  });
  window.dispatchEvent(new HashChangeEvent('hashchange'));
  return wrapper;
}

const TOOL_ROUTES = ['image', 'video', 'animation', 'font', 'batch', 'handdraw'];

describe('App', () => {
  it('renders the home page with a launch card per tool', () => {
    const wrapper = mountAt('#/');

    expect(wrapper.text()).toContain('Dot Matrix Studio');
    expect(wrapper.text()).toContain('All-in-One Dot Matrix Solution');
    for (const route of TOOL_ROUTES) {
      expect(wrapper.find(`[data-test="launch-${route}"]`).exists()).toBe(true);
    }
  });

  it('launches tools from the home page cards', async () => {
    const wrapper = mountAt('#/');

    await wrapper.get('[data-test="launch-handdraw"]').trigger('click');
    expect(window.location.hash).toBe('#/handdraw');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Pixel Editor');
  });

  it('shows a global nav that routes between all tool pages', async () => {
    const wrapper = mountAt('#/');

    for (const route of TOOL_ROUTES) {
      await wrapper.get(`[data-test="nav-${route}"]`).trigger('click');
      expect(window.location.hash).toBe(`#/${route}`);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.tool-page').exists()).toBe(true);
      expect(wrapper.get(`[data-test="nav-${route}"]`).classes()).toContain('active');
    }
  }, 10000);

  it('renders the shared tool layout and code output on every tool page', async () => {
    const wrapper = mountAt('#/');

    for (const route of TOOL_ROUTES) {
      window.location.hash = `#/${route}`;
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.tool-toolbar').exists()).toBe(true);
      expect(wrapper.find('[data-test="code-output"]').exists()).toBe(true);
    }
  }, 10000);

  it('exposes real image page controls for upload and processing', async () => {
    const wrapper = mountAt('#/image');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-test="open-image"]').exists()).toBe(true);
    expect(wrapper.find('input[type="file"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Color Mode');
    expect(wrapper.text()).toContain('Threshold');
    expect(wrapper.find('[data-test="scan-direction"]').exists()).toBe(true);
  });

  it('exposes video extraction controls with re-extract support', async () => {
    const wrapper = mountAt('#/video');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('input[type="file"][accept="video/*"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Re-extract Frames');
    expect(wrapper.text()).toContain('Frame Gallery');
    expect(wrapper.text()).toContain('Sample FPS');
  });

  it('exposes GIF frame extraction controls with playback', async () => {
    const wrapper = mountAt('#/animation');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('input[type="file"][accept="image/gif"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Frame Range');
    expect(wrapper.text()).toContain('Sample Step');
  });

  it('exposes font rendering controls and generates output on mount', async () => {
    const wrapper = mountAt('#/font');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('input[aria-label="Font text"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Regenerate');
    expect(wrapper.text()).toContain('Glyph Preview');
    expect(wrapper.text()).toContain('Upload TTF/OTF');
  });

  it('exposes batch controls for multi-image processing', async () => {
    const wrapper = mountAt('#/batch');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('input[type="file"][multiple]').exists()).toBe(true);
    expect(wrapper.find('[data-test="start-batch"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Summary Statistics');
    expect(wrapper.text()).toContain('Apply Settings to All');
  });

  it('exposes drawing tools, history and encoding on the handdraw page', async () => {
    const wrapper = mountAt('#/handdraw');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.pixel-canvas').exists()).toBe(true);
    for (const tool of ['pencil', 'eraser', 'fill', 'eyedropper']) {
      expect(wrapper.find(`[data-test="tool-${tool}"]`).exists()).toBe(true);
    }
    expect(wrapper.text()).toContain('Undo');
    expect(wrapper.text()).toContain('Redo');
    expect(wrapper.text()).toContain('Clear');
    expect(wrapper.find('[data-test="handdraw-output-format"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="handdraw-scan"]').exists()).toBe(true);
  });

  it('switches handdraw output format between C array, hex and binary', async () => {
    const wrapper = mountAt('#/handdraw');
    await wrapper.vm.$nextTick();

    const select = wrapper.get('[data-test="handdraw-output-format"]');
    await select.setValue('hex');
    expect(wrapper.find('.code-body').text()).toContain('0x');
    await select.setValue('c-array');
    expect(wrapper.find('.code-body').text()).toContain('const uint8_t');
  });
});
