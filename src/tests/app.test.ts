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

  it('uses ordered pixel samples for the image page empty previews', async () => {
    window.location.hash = '#/image';
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    });
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await wrapper.vm.$nextTick();

    expect(wrapper.findAll('.image-pixel-sample').length).toBeGreaterThanOrEqual(3);
    expect(wrapper.findAll('.image-pixel-sample .pixel-dot').length).toBeGreaterThan(120);
    expect(wrapper.find('.loaded-image.panda').exists()).toBe(false);
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

  it('uses ordered pixel samples for the batch page empty previews', async () => {
    window.location.hash = '#/batch';
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    });
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await wrapper.vm.$nextTick();

    expect(wrapper.findAll('.batch-pixel-sample').length).toBeGreaterThanOrEqual(3);
    expect(wrapper.findAll('.batch-pixel-sample .pixel-dot').length).toBeGreaterThan(120);
    expect(wrapper.find('.empty-row .batch-pixel-sample').exists()).toBe(true);
    expect(wrapper.find('.batch-preview.sample-preview').exists()).toBe(true);
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

  it('uses ordered pixel samples for the animation page empty previews', async () => {
    window.location.hash = '#/animation';
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    });
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await wrapper.vm.$nextTick();

    expect(wrapper.findAll('.animation-pixel-sample').length).toBeGreaterThanOrEqual(4);
    expect(wrapper.findAll('.animation-pixel-sample .pixel-dot').length).toBeGreaterThan(180);
    expect(wrapper.findAll('.frame-thumb.empty-thumb').length).toBeGreaterThanOrEqual(4);
    expect(wrapper.find('.black-player.sample-preview').exists()).toBe(true);
    expect(wrapper.find('.zoom-matrix.sample-preview').exists()).toBe(true);
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

  it('uses ordered pixel samples for the video page empty previews', async () => {
    window.location.hash = '#/video';
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    });
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await wrapper.vm.$nextTick();

    expect(wrapper.findAll('.video-pixel-sample').length).toBeGreaterThanOrEqual(4);
    expect(wrapper.findAll('.video-pixel-sample .pixel-dot').length).toBeGreaterThan(180);
    expect(wrapper.find('.hero-video.landscape:not(video)').exists()).toBe(false);
    expect(wrapper.findAll('.video-thumb.empty-thumb').length).toBeGreaterThanOrEqual(4);
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

  it('uses ordered pixel samples for the handdraw page preview resources', async () => {
    window.location.hash = '#/handdraw';
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    });
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await wrapper.vm.$nextTick();

    expect(wrapper.findAll('.handdraw-pixel-sample').length).toBeGreaterThanOrEqual(3);
    expect(wrapper.findAll('.handdraw-pixel-sample .pixel-dot').length).toBeGreaterThan(100);
    expect(wrapper.find('.cat-logo').exists()).toBe(false);
    expect(wrapper.find('.pixel-canvas').exists()).toBe(true);
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

  it('keeps home launch labels readable and rotates multiple preview frames per tool', () => {
    window.location.hash = '#/';
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    });

    const launches = wrapper.findAll('.launch-btn');
    expect(launches).toHaveLength(6);
    for (const launch of launches) {
      expect(launch.classes()).toContain('launch-readable');
      expect(launch.text()).toContain('Launch');
    }

    expect(wrapper.findAll('.pixel-preview-frame')).toHaveLength(18);
    expect(wrapper.find('[data-preview-kind="image"]').exists()).toBe(true);
    expect(wrapper.find('[data-preview-kind="video"]').exists()).toBe(true);
    expect(wrapper.find('[data-preview-kind="animation"]').exists()).toBe(true);
    expect(wrapper.find('[data-preview-kind="editor"]').exists()).toBe(true);
    expect(wrapper.find('[data-preview-kind="batch"]').exists()).toBe(true);
    expect(wrapper.find('[data-preview-kind="data"]').exists()).toBe(true);
  });
});
