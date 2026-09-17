import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import { useFontModuloStore } from '../features/font/stores/fontModuloStore';

describe('fontModuloStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps glyph array names unique for repeated characters', () => {
    const store = useFontModuloStore();

    store.text = 'aa';
    store.targetWidth = 4;
    store.targetHeight = 4;
    store.generate();

    const names = [...store.generatedSource.matchAll(/const uint8_t (font_\w+)\[\] PROGMEM/g)]
      .map((match) => match[1]);
    expect(names.length).toBe(2);
    expect(new Set(names).size).toBe(names.length);
    expect(names[0]).toBe('font_a_4x4');
    expect(names[1]).toBe('font_a_4x4_2');
  });

  it('cancels pending generation when the store is disposed', async () => {
    vi.useFakeTimers();
    const store = useFontModuloStore();

    store.text = 'AB';
    await nextTick();
    store.$dispose();
    vi.advanceTimersByTime(200);

    expect(store.glyphs).toHaveLength(0);
  });
});
