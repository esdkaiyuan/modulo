import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { usePixelStore } from '../stores/pixelStore';

describe('pixel store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('records pixel edits and can undo and redo them', () => {
    const store = usePixelStore();

    store.paintPixel(1, 1);
    expect(store.pixelAt(1, 1)).toBe('#FF6B9D');

    store.undo();
    expect(store.pixelAt(1, 1)).toBeNull();

    store.redo();
    expect(store.pixelAt(1, 1)).toBe('#FF6B9D');
  });

  it('updates generated C output after drawing', () => {
    const store = usePixelStore();

    store.paintPixel(0, 0);

    expect(store.cArrayOutput).toContain('image_32x32');
    expect(store.cArrayOutput).toContain('0x80');
  });
});
