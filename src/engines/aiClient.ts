/**
 * AI integration client: turns generated modulo data files into
 * ready-to-port driver/wrapper code for a target device via an
 * OpenAI-compatible or Anthropic chat API called directly from the browser.
 */

export type AiProtocol = 'openai' | 'anthropic';

export interface AiConfig {
  protocol: AiProtocol;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface InputCodeFile {
  name: string;
  content: string;
}

export interface GeneratedFile {
  name: string;
  content: string;
}

export type DeviceKind = 'display' | 'audio';

export type BusProtocol = 'i2c' | 'spi' | 'i2s' | 'pwm' | 'dac' | 'onewire' | 'uart';

export interface BusPinField {
  key: string;
  label: string;
  optional?: boolean;
}

export interface BusExtraField {
  key: 'addr' | 'freq' | 'baud';
  default: string;
}

export interface BusPreset {
  id: BusProtocol;
  label: string;
  pins: BusPinField[];
  extras: BusExtraField[];
}

export interface DevicePreset {
  id: string;
  kind: DeviceKind;
  label: string;
  hint: string;
  bus?: BusProtocol;
}

export interface PlatformPreset {
  id: string;
  label: string;
  hint: string;
}

export interface ProviderPreset {
  id: string;
  label: string;
  protocol: AiProtocol;
  baseUrl: string;
  model: string;
}

export const DEVICE_PRESETS: DevicePreset[] = [
  {
    id: 'ssd1306-i2c',
    kind: 'display',
    bus: 'i2c',
    label: 'SSD1306 OLED 128×64 (I2C)',
    hint: 'SSD1306 monochrome OLED over I2C at address 0x3C: full command init sequence, page addressing, framebuffer flush.'
  },
  {
    id: 'ssd1306-spi',
    kind: 'display',
    bus: 'spi',
    label: 'SSD1306 OLED 128×64 (SPI)',
    hint: 'SSD1306 monochrome OLED over 4-wire SPI (DC + RST pins): init sequence and framebuffer flush.'
  },
  {
    id: 'st7735',
    kind: 'display',
    bus: 'spi',
    label: 'ST7735 TFT 160×128 (SPI)',
    hint: 'ST7735 color TFT over SPI: init sequence, CASET/RASET window, RGB565 pixel push.'
  },
  {
    id: 'st7789',
    kind: 'display',
    bus: 'spi',
    label: 'ST7789 TFT 240×240 (SPI)',
    hint: 'ST7789 color TFT over SPI (no CS on some boards): init sequence, address window, RGB565 pixel push.'
  },
  {
    id: 'ili9341',
    kind: 'display',
    bus: 'spi',
    label: 'ILI9341 TFT 320×240 (SPI)',
    hint: 'ILI9341 color TFT over SPI: init sequence, address window, RGB565 pixel push, optional DMA note.'
  },
  {
    id: 'max7219',
    kind: 'display',
    bus: 'spi',
    label: 'MAX7219 LED matrix 8×8 (SPI)',
    hint: 'MAX7219/MAX7221 8×8 LED matrix chain over SPI: init (decode off, scan limit, intensity), per-row refresh, multi-module cascade.'
  },
  {
    id: 'ws2812',
    kind: 'display',
    bus: 'onewire',
    label: 'WS2812 NeoPixel matrix',
    hint: 'WS2812/NeoPixel RGB LED matrix: serpentine or row-major layout mapping from the array, brightness scaling, timing-safe output for the chosen platform.'
  },
  {
    id: 'pcd8544',
    kind: 'display',
    bus: 'spi',
    label: 'PCD8544 Nokia 5110 84×48 (SPI)',
    hint: 'PCD8544 monochrome LCD over SPI: init (bias, contrast/Vop), bank addressing, framebuffer flush.'
  },
  {
    id: 'pwm-buzzer',
    kind: 'audio',
    bus: 'pwm',
    label: 'PWM buzzer / speaker',
    hint: 'PCM playback through PWM (timer-based on AVR/STM32, LEDC on ESP32): timer ISR at the sample rate feeding duty cycle from the array.'
  },
  {
    id: 'dac8',
    kind: 'audio',
    bus: 'dac',
    label: 'On-chip DAC (8-bit, e.g. ESP32 GPIO25)',
    hint: 'PCM playback via the built-in DAC: timer-driven sample output at the array sample rate, 8-bit unsigned samples map directly.'
  },
  {
    id: 'i2s-max98357',
    kind: 'audio',
    bus: 'i2s',
    label: 'I2S amplifier (MAX98357 / PCM5102)',
    hint: 'PCM playback over I2S to an external amplifier/DAC: I2S peripheral config matching the array sample rate and 16-bit signed samples, DMA double-buffered writes.'
  },
  {
    id: 'custom',
    kind: 'display',
    label: 'Custom…',
    hint: ''
  }
];

export const BUS_PRESETS: BusPreset[] = [
  {
    id: 'i2c',
    label: 'I2C',
    pins: [
      { key: 'SDA', label: 'SDA' },
      { key: 'SCL', label: 'SCL' },
      { key: 'RST', label: 'RST', optional: true }
    ],
    extras: [
      { key: 'addr', default: '0x3C' },
      { key: 'freq', default: '400000' }
    ]
  },
  {
    id: 'spi',
    label: 'SPI',
    pins: [
      { key: 'SCK', label: 'SCK' },
      { key: 'MOSI', label: 'MOSI' },
      { key: 'CS', label: 'CS', optional: true },
      { key: 'DC', label: 'DC', optional: true },
      { key: 'RST', label: 'RST', optional: true },
      { key: 'BL', label: 'BL', optional: true }
    ],
    extras: [{ key: 'freq', default: '20000000' }]
  },
  {
    id: 'i2s',
    label: 'I2S',
    pins: [
      { key: 'BCLK', label: 'BCLK' },
      { key: 'LRCK', label: 'LRCK / WS' },
      { key: 'DIN', label: 'DIN / DOUT' }
    ],
    extras: []
  },
  {
    id: 'pwm',
    label: 'PWM',
    pins: [{ key: 'OUT', label: 'PWM OUT' }],
    extras: []
  },
  {
    id: 'dac',
    label: 'DAC',
    pins: [{ key: 'OUT', label: 'DAC OUT' }],
    extras: []
  },
  {
    id: 'onewire',
    label: '单总线 / One-wire',
    pins: [{ key: 'DIN', label: 'DIN' }],
    extras: []
  },
  {
    id: 'uart',
    label: 'UART',
    pins: [
      { key: 'TX', label: 'TX' },
      { key: 'RX', label: 'RX', optional: true }
    ],
    extras: [{ key: 'baud', default: '115200' }]
  }
];

/** Sensible default pins per platform × bus, prefilled into the pin fields. */
export const DEFAULT_PINS: Record<string, Record<string, Record<string, string>>> = {
  'arduino-avr': {
    i2c: { SDA: 'A4', SCL: 'A5' },
    spi: { SCK: '13', MOSI: '11', CS: '10', DC: '9', RST: '8' },
    pwm: { OUT: '9' },
    onewire: { DIN: '6' },
    uart: { TX: '1', RX: '0' }
  },
  'esp32-arduino': {
    i2c: { SDA: '21', SCL: '22' },
    spi: { SCK: '18', MOSI: '23', CS: '5', DC: '2', RST: '4' },
    i2s: { BCLK: '26', LRCK: '25', DIN: '22' },
    pwm: { OUT: '25' },
    dac: { OUT: '25' },
    onewire: { DIN: '5' },
    uart: { TX: '17', RX: '16' }
  },
  'esp-idf': {
    i2c: { SDA: '21', SCL: '22' },
    spi: { SCK: '18', MOSI: '23', CS: '5', DC: '2', RST: '4' },
    i2s: { BCLK: '26', LRCK: '25', DIN: '22' },
    pwm: { OUT: '25' },
    dac: { OUT: '25' },
    onewire: { DIN: '5' },
    uart: { TX: '17', RX: '16' }
  },
  'stm32-hal': {
    i2c: { SDA: 'PB7', SCL: 'PB6' },
    spi: { SCK: 'PA5', MOSI: 'PA7', CS: 'PA4', DC: 'PA3', RST: 'PA2' },
    i2s: { BCLK: 'PB13', LRCK: 'PB12', DIN: 'PB15' },
    pwm: { OUT: 'PA8' },
    onewire: { DIN: 'PA1' },
    uart: { TX: 'PA9', RX: 'PA10' }
  },
  rp2040: {
    i2c: { SDA: '4', SCL: '5' },
    spi: { SCK: '18', MOSI: '19', CS: '17', DC: '16', RST: '20' },
    i2s: { BCLK: '10', LRCK: '11', DIN: '9' },
    pwm: { OUT: '15' },
    onewire: { DIN: '2' },
    uart: { TX: '0', RX: '1' }
  }
};

export const PLATFORM_PRESETS: PlatformPreset[] = [
  { id: 'arduino-avr', label: 'Arduino (AVR: Uno / Nano / Mega)', hint: 'Arduino framework on 8-bit AVR: data stays in PROGMEM, read with pgm_read_byte/word; mind the 2 KB SRAM.' },
  { id: 'esp32-arduino', label: 'ESP32 (Arduino framework)', hint: 'ESP32 with the Arduino core: PROGMEM is a no-op, arrays readable directly; use driver APIs from the Arduino-ESP32 core.' },
  { id: 'esp-idf', label: 'ESP32 (ESP-IDF)', hint: 'Native ESP-IDF (C, FreeRTOS): use esp_driver APIs (i2c_master, spi_master, ledc, i2s_std), no Arduino functions.' },
  { id: 'stm32-hal', label: 'STM32 (HAL / CubeMX)', hint: 'STM32 HAL: assume handles like hspi1/hi2c1/htim2 exist from CubeMX; use HAL_* calls only.' },
  { id: 'rp2040', label: 'RP2040 (Pico SDK)', hint: 'Raspberry Pi Pico SDK in C: hardware/spi.h, hardware/i2c.h, hardware/pwm.h, pico/stdlib.h.' }
];

export const PROVIDER_PRESETS: ProviderPreset[] = [
  { id: 'deepseek', label: 'DeepSeek', protocol: 'openai', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
  { id: 'moonshot', label: 'Kimi', protocol: 'openai', baseUrl: 'https://api.moonshot.cn/v1', model: 'kimi-k2-0711-preview' },
  { id: 'zhipu', label: '智谱 GLM', protocol: 'openai', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4.5' },
  { id: 'openai', label: 'OpenAI', protocol: 'openai', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { id: 'anthropic', label: 'Anthropic', protocol: 'anthropic', baseUrl: 'https://api.anthropic.com', model: 'claude-sonnet-4-5' },
  { id: 'ollama', label: 'Ollama (local)', protocol: 'openai', baseUrl: 'http://localhost:11434/v1', model: 'qwen2.5-coder' }
];

/**
 * Shrink a modulo data file for the prompt: keep every declaration,
 * comment and constant, but truncate large array bodies to a few lines.
 * The generated code #includes the original file, so the model only
 * needs names, types and sizes — never the raw bytes.
 */
export function summarizeModuloCode(source: string, keepLines = 4): string {
  const lines = source.split(/\r?\n/);
  const out: string[] = [];
  let inArray = false;
  let kept = 0;
  let omitted = 0;
  for (const line of lines) {
    if (!inArray) {
      out.push(line);
      if (/=\s*\{\s*$/.test(line)) {
        inArray = true;
        kept = 0;
        omitted = 0;
      }
    } else if (/^\s*\}\s*;?\s*$/.test(line)) {
      if (omitted > 0) out.push(`  /* … ${omitted} data lines omitted — full data in the original file … */`);
      out.push(line);
      inArray = false;
    } else if (kept < keepLines) {
      out.push(line);
      kept += 1;
    } else {
      omitted += 1;
    }
  }
  let text = out.join('\n');
  const HARD_CAP = 16000;
  if (text.length > HARD_CAP) {
    text = `${text.slice(0, HARD_CAP)}\n/* … file truncated for the prompt … */`;
  }
  return text;
}

/** Pin fields for a bus, prefilled with the platform's conventional pins. */
export function defaultPins(platformId: string, bus: BusProtocol): Record<string, string> {
  const preset = BUS_PRESETS.find((b) => b.id === bus);
  const defaults = DEFAULT_PINS[platformId]?.[bus] ?? {};
  const pins: Record<string, string> = {};
  for (const field of preset?.pins ?? []) pins[field.key] = defaults[field.key] ?? '';
  return pins;
}

export interface PromptOptions {
  files: InputCodeFile[];
  deviceKind: DeviceKind;
  deviceLabel: string;
  deviceHint: string;
  platformLabel: string;
  platformHint: string;
  busLabel: string;
  /** Wiring rows (label → pin/value); empty values are skipped. */
  pins: { label: string; value: string }[];
  wiringExtras: { label: string; value: string }[];
  extra: string;
  locale: 'zh' | 'en';
}

export const FILE_MARKER_START = '===== FILE:';
export const FILE_MARKER_END = '===== END FILE =====';

export function buildIntegrationPrompt(options: PromptOptions): { system: string; user: string } {
  const commentLang = options.locale === 'zh' ? 'Simplified Chinese' : 'English';
  const system = [
    'You are an expert embedded firmware engineer. The user gives you data files generated by a dot-matrix/PCM converter (C arrays of bitmap or audio data, bodies truncated in this prompt). Produce complete, compilable integration code for the target device and platform.',
    '',
    'Requirements:',
    '1. Implement the communication protocol layer yourself (bus init, command/init sequence, low-level writes). Do not depend on third-party driver libraries unless the platform requires it.',
    '2. Provide a small wrapper API (init / draw or play functions) that consumes the user\'s arrays by their exact symbol names, honoring the format described in the data file comments (bit order, scan direction, color format, sample rate, bit depth).',
    '3. Include a minimal usage example (setup/loop or app_main) that renders or plays the user\'s data.',
    '4. NEVER re-embed the large data arrays: #include the user\'s data file by its original file name instead.',
    `5. All code comments in ${commentLang}. Add a short header comment in each file explaining wiring/pin assumptions.`,
    '',
    'Output format — output ONLY files, no prose before or after, each file wrapped exactly like this:',
    `${FILE_MARKER_START} <filename> =====`,
    '<raw file content, no markdown fences>',
    FILE_MARKER_END
  ].join('\n');

  const parts: string[] = [];
  parts.push(`Target device: ${options.deviceLabel}`);
  if (options.deviceHint) parts.push(`Device notes: ${options.deviceHint}`);
  parts.push(`Target platform: ${options.platformLabel}`);
  if (options.platformHint) parts.push(`Platform notes: ${options.platformHint}`);
  const wiring = [
    ...options.pins.filter((p) => p.value.trim()).map((p) => `${p.label} = ${p.value.trim()}`),
    ...options.wiringExtras.filter((e) => e.value.trim()).map((e) => `${e.label} = ${e.value.trim()}`)
  ];
  if (options.busLabel) parts.push(`Bus / interface: ${options.busLabel}`);
  if (wiring.length) {
    parts.push(`Wiring (use EXACTLY these pins/values, expose them as named #define constants at the top): ${wiring.join(', ')}`);
  }
  if (options.extra.trim()) parts.push(`Extra requirements from the user: ${options.extra.trim()}`);
  parts.push('');
  parts.push(`Data files (${options.files.length}), array bodies truncated:`);
  for (const file of options.files) {
    parts.push('');
    parts.push(`--- ${file.name} ---`);
    parts.push(summarizeModuloCode(file.content));
  }
  parts.push('');
  parts.push(
    `Reference the data with EXACTLY these directives, character for character: ${options.files
      .map((f) => `#include "${f.name}"`)
      .join('  ')}`
  );
  return { system, user: parts.join('\n') };
}

/** Follow-up turn asking the model to revise its previous output. */
export function buildRefineMessage(instruction: string): string {
  return [
    `Revise the files you just generated according to these new requirements: ${instruction.trim()}`,
    '',
    `Output ALL files again in full (not only the changed parts), using exactly the same ${FILE_MARKER_START} <filename> ===== / ${FILE_MARKER_END} format, no prose.`
  ].join('\n');
}

/** Split the model output into files by the ===== FILE: ===== markers. */
export function parseGeneratedFiles(text: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const startRe = /^\s*=====\s*FILE:\s*(.+?)\s*=====\s*$/;
  const endRe = /^\s*=====\s*END\s+FILE\s*=====\s*$/;
  let current: { name: string; lines: string[] } | null = null;
  for (const line of text.split(/\r?\n/)) {
    const start = line.match(startRe);
    if (start) {
      if (current) files.push({ name: current.name, content: current.lines.join('\n').trim() });
      current = { name: start[1], lines: [] };
      continue;
    }
    if (endRe.test(line)) {
      if (current) files.push({ name: current.name, content: current.lines.join('\n').trim() });
      current = null;
      continue;
    }
    if (current) current.lines.push(line);
  }
  if (current) files.push({ name: current.name, content: current.lines.join('\n').trim() });
  if (!files.length && text.trim()) {
    // Model ignored the markers — degrade to a single file, stripping one
    // optional markdown fence so the content is still usable.
    const stripped = text.trim().replace(/^```[\w+-]*\n([\s\S]*?)\n```$/m, '$1');
    files.push({ name: 'integration_output.txt', content: stripped });
  }
  return files;
}

function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}${path}`;
}

/** Read an SSE stream, invoking onData for every `data:` payload. */
async function readSse(response: Response, onData: (payload: string) => void): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Streaming not supported by this response');
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const raw of lines) {
      const line = raw.trim();
      if (line.startsWith('data:')) onData(line.slice(5).trim());
    }
  }
}

async function throwHttpError(response: Response): Promise<never> {
  let detail = '';
  try {
    const body = await response.text();
    detail = body.slice(0, 400);
  } catch {
    /* body unreadable */
  }
  throw new Error(`HTTP ${response.status} ${response.statusText}${detail ? ` — ${detail}` : ''}`);
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Fetch the list of available model ids from the provider using the same
 * baseUrl + apiKey as chat. OpenAI-compatible: GET /models. Anthropic:
 * GET /v1/models. Returns sorted, de-duplicated model ids.
 */
export async function fetchModels(config: {
  protocol: AiProtocol;
  baseUrl: string;
  apiKey: string;
}): Promise<string[]> {
  const isAnthropic = config.protocol === 'anthropic';
  const url = joinUrl(config.baseUrl, isAnthropic ? '/v1/models' : '/models');
  const headers: Record<string, string> = isAnthropic
    ? {
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      }
    : { authorization: `Bearer ${config.apiKey}` };

  const response = await fetch(url, { method: 'GET', headers });
  if (!response.ok) await throwHttpError(response);

  const json = await response.json();
  // OpenAI: { data: [{ id }] }; Anthropic: { data: [{ id }] }; some
  // providers return a bare array or { models: [...] }.
  const rawList: unknown[] = Array.isArray(json)
    ? json
    : Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json?.models)
        ? json.models
        : [];

  const ids = rawList
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        return (obj.id ?? obj.name ?? obj.model) as string | undefined;
      }
      return undefined;
    })
    .filter((id): id is string => typeof id === 'string' && id.length > 0);

  return [...new Set(ids)].sort((a, b) => a.localeCompare(b));
}

/**
 * Stream a chat completion, calling onDelta with each text fragment.
 * Returns the full accumulated text.
 */
export async function streamChat(
  config: AiConfig,
  system: string,
  messages: ChatMessage[],
  onDelta: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  let full = '';
  const push = (piece: string) => {
    if (!piece) return;
    full += piece;
    onDelta(piece);
  };

  if (config.protocol === 'anthropic') {
    const response = await fetch(joinUrl(config.baseUrl, '/v1/messages'), {
      method: 'POST',
      signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 16000,
        stream: true,
        system,
        messages
      })
    });
    if (!response.ok) await throwHttpError(response);
    await readSse(response, (payload) => {
      try {
        const event = JSON.parse(payload);
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          push(event.delta.text ?? '');
        }
      } catch {
        /* keep-alive or non-JSON payload */
      }
    });
    return full;
  }

  const response = await fetch(joinUrl(config.baseUrl, '/chat/completions'), {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      stream: true,
      messages: [{ role: 'system', content: system }, ...messages]
    })
  });
  if (!response.ok) await throwHttpError(response);
  await readSse(response, (payload) => {
    if (payload === '[DONE]') return;
    try {
      const event = JSON.parse(payload);
      push(event.choices?.[0]?.delta?.content ?? '');
    } catch {
      /* keep-alive or non-JSON payload */
    }
  });
  return full;
}
