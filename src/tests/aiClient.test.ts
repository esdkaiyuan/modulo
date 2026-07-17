import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildIntegrationPrompt,
  buildRefineMessage,
  defaultPins,
  DEVICE_PRESETS,
  fetchModels,
  parseGeneratedFiles,
  PLATFORM_PRESETS,
  summarizeModuloCode
} from '../engines/aiClient';

const BIG_ARRAY = [
  '// Bitmap: 16x16, mono, MSB first',
  'const uint8_t logo[] PROGMEM = {',
  ...Array.from({ length: 40 }, (_, i) => `  0x${(i % 256).toString(16).padStart(2, '0')}, 0xFF, 0x00, 0xAA,`),
  '};',
  'const uint16_t logo_len = 160;'
].join('\n');

describe('summarizeModuloCode', () => {
  it('keeps declarations, comments and trailing constants', () => {
    const out = summarizeModuloCode(BIG_ARRAY);
    expect(out).toContain('// Bitmap: 16x16, mono, MSB first');
    expect(out).toContain('const uint8_t logo[] PROGMEM = {');
    expect(out).toContain('const uint16_t logo_len = 160;');
  });

  it('truncates array bodies and notes the omission', () => {
    const out = summarizeModuloCode(BIG_ARRAY, 4);
    expect(out).toContain('36 data lines omitted');
    expect(out.split('\n').length).toBeLessThan(15);
  });

  it('leaves single-line arrays untouched', () => {
    const src = 'const uint8_t x[] = { 0x01, 0x02 };';
    expect(summarizeModuloCode(src)).toBe(src);
  });

  it('handles multiple arrays in one file', () => {
    const src = [BIG_ARRAY, '', BIG_ARRAY.replace(/logo/g, 'icon')].join('\n');
    const out = summarizeModuloCode(src, 2);
    expect(out).toContain('const uint8_t logo[] PROGMEM = {');
    expect(out).toContain('const uint8_t icon[] PROGMEM = {');
    expect(out.match(/data lines omitted/g)?.length).toBe(2);
  });

  it('preserves 2D frame arrays with inner braces as data lines', () => {
    const src = [
      'const uint8_t frames[2][4] PROGMEM = {',
      '  { 0x01, 0x02, 0x03, 0x04 },',
      '  { 0x05, 0x06, 0x07, 0x08 },',
      '};'
    ].join('\n');
    const out = summarizeModuloCode(src, 4);
    expect(out).toBe(src);
  });
});

describe('parseGeneratedFiles', () => {
  it('splits marker-wrapped output into named files', () => {
    const text = [
      '===== FILE: ssd1306.h =====',
      '#pragma once',
      'void ssd1306_init(void);',
      '===== END FILE =====',
      '===== FILE: main.c =====',
      '#include "ssd1306.h"',
      '===== END FILE ====='
    ].join('\n');
    const files = parseGeneratedFiles(text);
    expect(files.map((f) => f.name)).toEqual(['ssd1306.h', 'main.c']);
    expect(files[0].content).toBe('#pragma once\nvoid ssd1306_init(void);');
    expect(files[1].content).toBe('#include "ssd1306.h"');
  });

  it('closes an unterminated final file at EOF (mid-stream parsing)', () => {
    const text = '===== FILE: a.h =====\nint x;\nint y;';
    const files = parseGeneratedFiles(text);
    expect(files).toHaveLength(1);
    expect(files[0].content).toBe('int x;\nint y;');
  });

  it('starts a new file even without an END marker in between', () => {
    const text = '===== FILE: a.h =====\nint a;\n===== FILE: b.h =====\nint b;';
    const files = parseGeneratedFiles(text);
    expect(files.map((f) => f.name)).toEqual(['a.h', 'b.h']);
  });

  it('falls back to a single file when markers are missing', () => {
    const files = parseGeneratedFiles('just some code');
    expect(files).toHaveLength(1);
    expect(files[0].name).toBe('integration_output.txt');
    expect(files[0].content).toBe('just some code');
  });

  it('strips a markdown fence in the fallback path', () => {
    const files = parseGeneratedFiles('```c\nint main(void) { return 0; }\n```');
    expect(files[0].content).toBe('int main(void) { return 0; }');
  });

  it('returns nothing for empty text', () => {
    expect(parseGeneratedFiles('')).toEqual([]);
  });
});

describe('buildIntegrationPrompt', () => {
  const device = DEVICE_PRESETS.find((d) => d.id === 'ssd1306-i2c')!;
  const platform = PLATFORM_PRESETS.find((p) => p.id === 'esp32-arduino')!;

  function build(locale: 'zh' | 'en', extra = '') {
    return buildIntegrationPrompt({
      files: [{ name: 'logo.h', content: BIG_ARRAY }],
      deviceKind: 'display',
      deviceLabel: device.label,
      deviceHint: device.hint,
      platformLabel: platform.label,
      platformHint: platform.hint,
      busLabel: 'I2C',
      pins: [
        { label: 'SDA', value: '21' },
        { label: 'SCL', value: '22' },
        { label: 'RST', value: '' }
      ],
      wiringExtras: [{ label: 'I2C address', value: '0x3C' }],
      extra,
      locale
    });
  }

  it('includes device, platform and file name in the user prompt', () => {
    const { user } = build('en');
    expect(user).toContain(device.label);
    expect(user).toContain(device.hint);
    expect(user).toContain(platform.label);
    expect(user).toContain('--- logo.h ---');
    expect(user).toContain('#include "logo.h"');
  });

  it('truncates array bodies inside the prompt', () => {
    const { user } = build('en');
    expect(user).toContain('data lines omitted');
  });

  it('sets the comment language from the locale', () => {
    expect(build('zh').system).toContain('Simplified Chinese');
    expect(build('en').system).toContain('comments in English');
  });

  it('includes extra requirements only when given', () => {
    expect(build('en', 'use pins 21/22').user).toContain('use pins 21/22');
    expect(build('en').user).not.toContain('Extra requirements');
  });

  it('describes the output file markers in the system prompt', () => {
    const { system } = build('en');
    expect(system).toContain('===== FILE:');
    expect(system).toContain('===== END FILE =====');
  });

  it('lists wiring with exact pins, skipping empty ones', () => {
    const { user } = build('en');
    expect(user).toContain('Bus / interface: I2C');
    expect(user).toContain('SDA = 21');
    expect(user).toContain('SCL = 22');
    expect(user).toContain('I2C address = 0x3C');
    expect(user).not.toContain('RST =');
  });
});

describe('defaultPins', () => {
  it('prefills platform-specific pins for a known combo', () => {
    expect(defaultPins('esp32-arduino', 'i2c')).toEqual({ SDA: '21', SCL: '22', RST: '' });
    expect(defaultPins('arduino-avr', 'i2c')).toEqual({ SDA: 'A4', SCL: 'A5', RST: '' });
  });

  it('returns empty fields for an unknown platform', () => {
    const pins = defaultPins('nonexistent', 'spi');
    expect(Object.keys(pins)).toContain('SCK');
    expect(Object.values(pins).every((v) => v === '')).toBe(true);
  });
});

describe('buildRefineMessage', () => {
  it('embeds the instruction and re-states the file format', () => {
    const msg = buildRefineMessage('rotate the display 180 degrees');
    expect(msg).toContain('rotate the display 180 degrees');
    expect(msg).toContain('===== FILE:');
    expect(msg).toContain('ALL files again in full');
  });
});

describe('fetchModels', () => {
  afterEach(() => vi.unstubAllGlobals());

  function stub(status: number, body: unknown) {
    const fn = vi.fn(async () =>
      new Response(typeof body === 'string' ? body : JSON.stringify(body), {
        status,
        statusText: status === 200 ? 'OK' : 'Error',
        headers: { 'Content-Type': 'application/json' }
      })
    );
    vi.stubGlobal('fetch', fn);
    return fn;
  }

  it('calls GET /models with a Bearer header (openai) and dedupes + sorts ids', async () => {
    const fn = stub(200, { data: [{ id: 'b' }, { id: 'a' }, { id: 'b' }] });
    const ids = await fetchModels({ protocol: 'openai', baseUrl: 'https://api.x.com/v1', apiKey: 'k' });
    expect(ids).toEqual(['a', 'b']);
    const [url, init] = fn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.x.com/v1/models');
    expect(init.method).toBe('GET');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer k');
  });

  it('uses /v1/models and x-api-key header for anthropic', async () => {
    const fn = stub(200, { data: [{ id: 'claude-x' }] });
    await fetchModels({ protocol: 'anthropic', baseUrl: 'https://api.anthropic.com', apiKey: 'ak' });
    const [url, init] = fn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.anthropic.com/v1/models');
    expect((init.headers as Record<string, string>)['x-api-key']).toBe('ak');
  });

  it('accepts bare arrays and { models } shapes and name/model fields', async () => {
    stub(200, [{ name: 'm2' }, 'm1']);
    expect(await fetchModels({ protocol: 'openai', baseUrl: 'https://x', apiKey: 'k' })).toEqual(['m1', 'm2']);
  });

  it('throws on HTTP errors', async () => {
    stub(401, 'nope');
    await expect(fetchModels({ protocol: 'openai', baseUrl: 'https://x', apiKey: 'bad' })).rejects.toThrow('401');
  });
});
