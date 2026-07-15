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
    expect(wrapper.text()).toContain('Create and edit pixel art');
  });

  it('exposes one homepage launch card for every real tool page', async () => {
    window.location.hash = '#/';
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    });

    for (const route of TOOL_ROUTES) {
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

    const pages: Array<[string, string]> = [
      ['batch', 'Process multiple files with batch operations'],
      ['font', 'Chinese Character Dot Matrix Generator'],
      ['animation', 'Extract frames from animations'],
      ['image', 'Convert images to C array'],
      ['video', 'Extract frames from video'],
      ['handdraw', 'Create and edit pixel art']
    ];

    for (const [route, subtitle] of pages) {
      window.location.hash = `#/${route}`;
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).toContain(subtitle);
    }

    expect(wrapper.find('.module-nav').exists()).toBe(false);
  });

  it('wraps every tool page in the shared ToolLayout shell', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    });

    for (const route of TOOL_ROUTES) {
      window.location.hash = `#/${route}`;
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.tool-layout').exists()).toBe(true);
      expect(wrapper.find('.tool-topbar').exists()).toBe(true);
      expect(wrapper.find('.tool-left-rail').exists()).toBe(true);
      expect(wrapper.find('.tool-right-rail').exists()).toBe(true);
      expect(wrapper.find('.tool-bottombar').exists()).toBe(true);
      expect(wrapper.findAll('.export-btn').length).toBeGreaterThanOrEqual(5);
      expect(wrapper.find('.code-toggle-btn').exists()).toBe(true);
    }
  }, 10000);

  it('opens the code drawer with generated output from the bottom bar', async () => {
    const wrapper = mountAt('#/font');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.code-drawer').exists()).toBe(false);
    await wrapper.get('.code-toggle-btn').trigger('click');
    expect(wrapper.find('.code-drawer').exists()).toBe(true);
  });

  it('exposes real image page controls for upload and generation', async () => {
    const wrapper = mountAt('#/image');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('input[type="file"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Apply & Generate');
    expect(wrapper.text()).toContain('Processing Options');
  });

  it('uses ordered pixel samples for the image page empty previews', async () => {
    const wrapper = mountAt('#/image');
    await wrapper.vm.$nextTick();

    expect(wrapper.findAll('.image-pixel-sample').length).toBeGreaterThanOrEqual(3);
    expect(wrapper.findAll('.image-pixel-sample .pixel-dot').length).toBeGreaterThan(120);
    expect(wrapper.find('.loaded-image.panda').exists()).toBe(false);
  });

  it('exposes real batch page controls for multi-image processing', async () => {
    const wrapper = mountAt('#/batch');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('input[type="file"][multiple]').exists()).toBe(true);
    expect(wrapper.find('[data-test="start-batch"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Summary Statistics');
  });

  it('keeps batch queue and results in the batch workspace', async () => {
    const wrapper = mountAt('#/batch');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Input Files');
    expect(wrapper.text()).toContain('Start Batch');
    expect(wrapper.find('.file-table').exists()).toBe(true);
  });

  it('exposes real font page controls for text rendering', async () => {
    const wrapper = mountAt('#/font');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('input[aria-label="Font text"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Regenerate');
    expect(wrapper.text()).toContain('Pixel Preview');
  });

  it('renders the font preview canvas and generates output on mount', async () => {
    const wrapper = mountAt('#/font');
    await wrapper.vm.$nextTick();

    expect(wrapper.findAll('.font-canvas-wrap canvas').length).toBeGreaterThanOrEqual(1);
    expect(wrapper.text()).toContain('Encoding Options');
  });

  it('exposes real animation page controls for GIF frame extraction', async () => {
    const wrapper = mountAt('#/animation');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('input[type="file"][accept="image/gif"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Generate Frame Data');
    expect(wrapper.text()).toContain('Frame Settings');
  });

  it('shows an empty-state frame strip on the animation page before loading', async () => {
    const wrapper = mountAt('#/animation');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Load a GIF to extract frames');
    expect(wrapper.find('.black-player.sample-preview').exists()).toBe(true);
    expect(wrapper.find('.zoom-matrix.sample-preview').exists()).toBe(true);
  });

  it('exposes real video page controls for video frame extraction', async () => {
    const wrapper = mountAt('#/video');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('input[type="file"][accept="video/*"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Generate All');
    expect(wrapper.text()).toContain('Frame Gallery');
  });

  it('offers re-extraction with the current sampling settings on the video page', async () => {
    const wrapper = mountAt('#/video');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Re-extract Frames');
    expect(wrapper.text()).toContain('Extract Settings');
  });

  it('exposes shared encoding controls on the handdraw page', async () => {
    const wrapper = mountAt('#/handdraw');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-test="handdraw-output-format"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="handdraw-scan"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('ENCODING');
  });

  it('wires drawing tools and history controls on the handdraw page', async () => {
    const wrapper = mountAt('#/handdraw');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.pixel-canvas').exists()).toBe(true);
    expect(wrapper.text()).toContain('Pencil');
    expect(wrapper.text()).toContain('Undo');
    expect(wrapper.text()).toContain('Redo');
    expect(wrapper.text()).toContain('Clear');
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
    expect(wrapper.find('[data-preview-kind="font"]').exists()).toBe(true);
  });
});
