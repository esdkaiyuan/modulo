import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import App from '../App.vue';

describe('App', () => {
  it('renders the PixelCraft workbench shell', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    });

    expect(wrapper.text()).toContain('PixelCraft Web');
    expect(wrapper.text()).toContain('TOOLS');
    expect(wrapper.text()).toContain('HEX OUTPUT');
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
      ['Video', 'Video to Dot Matrix Extractor']
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
});
