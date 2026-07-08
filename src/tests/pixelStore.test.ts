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

  it('uses shared encoding options for bit order and polarity', () => {
    const store = usePixelStore();

    store.setCanvasSize(16);
    store.paintPixel(0, 0);
    store.bitOrder = 'lsb';
    expect(Array.from(store.byteOutput).slice(0, 1)).toEqual([0x01]);

    store.polarity = 'negative';
    expect(Array.from(store.byteOutput).slice(0, 1)).toEqual([0xfe]);
  });

  it('produces HEX text and binary blob output', async () => {
    const store = usePixelStore();

    store.setCanvasSize(16);
    store.paintPixel(0, 0);
    store.outputFormat = 'hex';

    expect(store.currentOutput).toContain('0x80');
    expect(store.outputFileName).toBe('image_16x16.hex.txt');

    store.outputFormat = 'bin';
    expect(store.outputBlob().size).toBe(store.byteOutput.length);
    expect(store.outputFileName).toBe('image_16x16.bin');
  });
});
