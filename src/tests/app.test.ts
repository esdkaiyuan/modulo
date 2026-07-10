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

  it('exposes one homepage launch card for every real tool page', async () => {
    window.location.hash = '#/';
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    });

    const launchTargets = ['image', 'video', 'animation', 'handdraw', 'batch', 'font'];
    for (const route of launchTargets) {
      const launch = wrapper.get(`[data-test="launch-${route}"]`);
      await launch.trigger('click');
      expect(window.location.hash).toBe(`#/${route}`);
    }
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

  it('matches the reference image converter page structure with adaptive preview windows', async () => {
    window.location.hash = '#/image';
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    });
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.image-reference-shell').exists()).toBe(true);
    expect(wrapper.find('.image-reference-grid').exists()).toBe(true);
    expect(wrapper.find('.image-import-row').exists()).toBe(true);
    expect(wrapper.find('.image-preview-row').exists()).toBe(true);
    expect(wrapper.find('.image-options-panel').exists()).toBe(true);
    expect(wrapper.find('.image-output-row').exists()).toBe(true);
    expect(wrapper.find('.image-output-preview-panel').exists()).toBe(true);
    expect(wrapper.findAll('.image-adaptive-window').length).toBeGreaterThanOrEqual(5);
    expect(wrapper.text()).toContain('Import Image');
    expect(wrapper.text()).toContain('Original Image (with crop)');
    expect(wrapper.text()).toContain('Preview (Dot Matrix)');
    expect(wrapper.text()).toContain('Processing Options');
    expect(wrapper.text()).toContain('Output Preview');
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

  it('matches the reference batch extractor page structure with adaptive result windows', async () => {
    window.location.hash = '#/batch';
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    });
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.batch-reference-shell').exists()).toBe(true);
    expect(wrapper.find('.batch-main-row').exists()).toBe(true);
    expect(wrapper.find('.batch-left-stack').exists()).toBe(true);
    expect(wrapper.find('.batch-config-column').exists()).toBe(true);
    expect(wrapper.find('.batch-summary-card').exists()).toBe(true);
    expect(wrapper.find('.batch-export-panel').exists()).toBe(true);
    expect(wrapper.findAll('.batch-adaptive-window').length).toBeGreaterThanOrEqual(1);
    expect(wrapper.text()).toContain('Start Batch');
    expect(wrapper.text()).toContain('Export All Results');
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

  it('uses ordered pixel samples for the font page preview resources', async () => {
    window.location.hash = '#/font';
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    });
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await wrapper.vm.$nextTick();

    expect(wrapper.findAll('.font-pixel-sample').length).toBeGreaterThanOrEqual(1);
    expect(wrapper.findAll('.font-pixel-sample .pixel-dot').length).toBeGreaterThan(20);
    expect(wrapper.find('.font-mark').exists()).toBe(false);
    expect(wrapper.findAll('.font-canvas-wrap canvas').length).toBeGreaterThanOrEqual(2);
  });

  it('matches the reference font extractor page structure with adaptive content windows', async () => {
    window.location.hash = '#/font';
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    });
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.font-reference-shell').exists()).toBe(true);
    expect(wrapper.find('.font-input-row').exists()).toBe(true);
    expect(wrapper.find('.font-main-row').exists()).toBe(true);
    expect(wrapper.find('.font-output-row').exists()).toBe(true);
    expect(wrapper.find('.font-generate-zone').exists()).toBe(true);
    expect(wrapper.find('.font-hex-card').exists()).toBe(true);
    expect(wrapper.findAll('.font-adaptive-window').length).toBeGreaterThanOrEqual(2);
    expect(wrapper.text()).toContain('Byte Order');
    expect(wrapper.text()).toContain('Output Format');
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

  it('matches the reference animation extractor page structure with adaptive work windows', async () => {
    window.location.hash = '#/animation';
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    });
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.animation-reference-shell').exists()).toBe(true);
    expect(wrapper.find('.animation-main-row').exists()).toBe(true);
    expect(wrapper.find('.animation-center-stack').exists()).toBe(true);
    expect(wrapper.find('.animation-side-rail').exists()).toBe(true);
    expect(wrapper.find('.animation-frame-settings').exists()).toBe(true);
    expect(wrapper.find('.animation-output-settings').exists()).toBe(true);
    expect(wrapper.find('.animation-preview-panel').exists()).toBe(true);
    expect(wrapper.findAll('.animation-adaptive-window').length).toBeGreaterThanOrEqual(4);
    expect(wrapper.text()).toContain('Frame Settings');
    expect(wrapper.text()).toContain('Output Settings');
    expect(wrapper.text()).toContain('Generated Animation Preview');
    expect(wrapper.text()).toContain('Generate Frame Data');
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

  it('matches the reference video extractor page structure with adaptive content windows', async () => {
    window.location.hash = '#/video';
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    });
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.video-reference-shell').exists()).toBe(true);
    expect(wrapper.find('.video-file-bar').exists()).toBe(true);
    expect(wrapper.find('.video-main-row').exists()).toBe(true);
    expect(wrapper.find('.video-bottom-row').exists()).toBe(true);
    expect(wrapper.find('.video-clip-controls').exists()).toBe(true);
    expect(wrapper.find('.video-animation-preview').exists()).toBe(true);
    expect(wrapper.findAll('.video-adaptive-window').length).toBeGreaterThanOrEqual(4);
    expect(wrapper.text()).toContain('Decode & Extract');
    expect(wrapper.text()).toContain('Extraction Stats');
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

  it('matches the reference handdraw editor structure with adaptive drawing windows', async () => {
    window.location.hash = '#/handdraw';
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    });
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.handdraw-reference-shell').exists()).toBe(true);
    expect(wrapper.find('.handdraw-reference-topbar').exists()).toBe(true);
    expect(wrapper.find('.handdraw-reference-workbench').exists()).toBe(true);
    expect(wrapper.find('.handdraw-tool-stack').exists()).toBe(true);
    expect(wrapper.find('.handdraw-canvas-stage').exists()).toBe(true);
    expect(wrapper.find('.handdraw-side-stack').exists()).toBe(true);
    expect(wrapper.find('.handdraw-color-card').exists()).toBe(true);
    expect(wrapper.find('.handdraw-preview-card').exists()).toBe(true);
    expect(wrapper.find('.handdraw-layers-card').exists()).toBe(true);
    expect(wrapper.find('.handdraw-output-panel').exists()).toBe(true);
    expect(wrapper.findAll('.handdraw-adaptive-window').length).toBeGreaterThanOrEqual(2);
    expect(wrapper.text()).toContain('PixelCraft Web');
    expect(wrapper.text()).toContain('HEX OUTPUT');
    expect(wrapper.text()).toContain('LAYERS');
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
  }, 10000);

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
  }, 10000);

  it('renders adaptive material windows for every extractor workspace', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    });

    const minimumWindows: Record<string, number> = {
      image: 3,
      batch: 1,
      font: 2,
      animation: 2,
      video: 3,
      handdraw: 2
    };

    for (const [route, minimum] of Object.entries(minimumWindows)) {
      window.location.hash = `#/${route}`;
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      await wrapper.vm.$nextTick();
      expect(wrapper.findAll('.adaptive-material-window').length).toBeGreaterThanOrEqual(minimum);
    }
  }, 10000);

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
    expect(wrapper.find('[data-preview-kind="font"]').exists()).toBe(true);
  });
});
