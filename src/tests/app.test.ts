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
});
