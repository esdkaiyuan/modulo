import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import App from '../App.vue';

describe('App', () => {
  it('renders the Dot Matrix Studio home page by default', () => {
    window.location.hash = '#/';
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    });

    expect(wrapper.text()).toContain('Dot Matrix Studio');
    expect(wrapper.text()).toContain('All-in-One Dot Matrix Solution');
    expect(wrapper.find('[data-test="launch-image"]').exists()).toBe(true);
  });

  it('launches tools from the home page cards', async () => {
    window.location.hash = '#/';
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    });

    await wrapper.get('[data-test="launch-handdraw"]').trigger('click');
    expect(window.location.hash).toBe('#/handdraw');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('PixelCraft Web');
  });

  it('switches between extractor pages by hash route without adding global chrome', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    });

    const pages = [
      ['Batch', 'Batch Data Extractor'],
      ['Font', 'PixelFont Extractor'],
      ['Animation', 'DotMatrix Frame Extractor'],
      ['Image', 'Dot Matrix Studio'],
      ['Video', 'Video to Dot Matrix Extractor'],
      ['Handdraw', 'PixelCraft Web']
    ];

    for (const [route, title] of pages) {
      window.location.hash = `#/${route.toLowerCase()}`;
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).toContain(title);
    }

    expect(wrapper.find('.module-nav').exists()).toBe(false);
  });

  it('exposes real image page controls for upload and generation', async () => {
    window.location.hash = '#/image';
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    });
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await wrapper.vm.$nextTick();

    expect(wrapper.find('input[type="file"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Apply & Generate');
    expect(wrapper.text()).toContain('Generated C Array');
  });

  it('exposes real batch page controls for multi-image processing', async () => {
    window.location.hash = '#/batch';
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    });
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await wrapper.vm.$nextTick();

    expect(wrapper.find('input[type="file"][multiple]').exists()).toBe(true);
    expect(wrapper.find('[data-test="start-batch"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Summary Statistics');
  });

  it('exposes real font page controls for text rendering', async () => {
    window.location.hash = '#/font';
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    });
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await wrapper.vm.$nextTick();

    expect(wrapper.find('input[aria-label="Font text"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Regenerate');
    expect(wrapper.text()).toContain('Generated Output');
  });

  it('exposes real animation page controls for GIF frame extraction', async () => {
    window.location.hash = '#/animation';
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    });
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await wrapper.vm.$nextTick();

    expect(wrapper.find('input[type="file"][accept="image/gif"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Generate Frame Data');
    expect(wrapper.text()).toContain('Generated Code');
  });

  it('exposes real video page controls for video frame extraction', async () => {
    window.location.hash = '#/video';
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    });
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await wrapper.vm.$nextTick();

    expect(wrapper.find('input[type="file"][accept="video/*"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Generate All');
    expect(wrapper.text()).toContain('Generated Output');
  });

  it('exposes shared encoding controls on the handdraw page', async () => {
    window.location.hash = '#/handdraw';
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    });
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-test="handdraw-output-format"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="handdraw-scan"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('ENCODING');
  });

  it('uses responsive tool page shells for every extractor workspace', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    });

    for (const route of ['image', 'batch', 'font', 'animation', 'video', 'handdraw']) {
      window.location.hash = `#/${route}`;
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.responsive-tool-page').exists()).toBe(true);
    }
  });

  it('uses the shared visual tool frame across all extractor workspaces', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    });

    for (const route of ['image', 'batch', 'font', 'animation', 'video', 'handdraw']) {
      window.location.hash = `#/${route}`;
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.tool-ui-frame').exists()).toBe(true);
    }
  });

  it('renders home previews as pixel particle matrices instead of decorative shape composites', () => {
    window.location.hash = '#/';
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    });

    expect(wrapper.findAll('.pixel-preview-window')).toHaveLength(6);
    expect(wrapper.findAll('.pixel-dot').length).toBeGreaterThan(200);
    expect(wrapper.find('.tool-visual.panda').exists()).toBe(false);
    expect(wrapper.find('.tool-visual.runner').exists()).toBe(false);
    expect(wrapper.find('.tool-visual.landscape').exists()).toBe(false);
  });
});
