import { defineStore } from 'pinia';
import { computed, nextTick, ref, watch } from 'vue';
import {
  buildIntegrationPrompt,
  buildRefineMessage,
  BUS_PRESETS,
  defaultPins,
  DEVICE_PRESETS,
  fetchModels,
  parseGeneratedFiles,
  PLATFORM_PRESETS,
  streamChat,
  type AiProtocol,
  type BusProtocol,
  type ChatMessage,
  type DeviceKind,
  type InputCodeFile
} from '../../../engines/aiClient';
import { makeTextBlob } from '../../../engines/outputFormatter';
import { useAuthStore } from '../../../user/authStore';
import { request } from '../../../user/serverApi';
import { locale, t } from '../../../i18n';
import type { MessageKey } from '../../../i18n/messages';

/** Every user-entered AI form field that should follow the account. Excludes
 *  input code, streamed output, and generated files (those are "content"). */
export interface AiFormSnapshot {
  protocol: AiProtocol;
  baseUrl: string;
  apiKey: string;
  model: string;
  deviceKind: DeviceKind;
  deviceId: string;
  customDevice: string;
  platformId: string;
  extra: string;
  bus: BusProtocol;
  pins: Record<string, string>;
  i2cAddr: string;
  busFreq: string;
  uartBaud: string;
}

type AiFormField = keyof AiFormSnapshot;

const AI_FORM_FIELDS: readonly AiFormField[] = [
  'protocol',
  'baseUrl',
  'apiKey',
  'model',
  'deviceKind',
  'deviceId',
  'customDevice',
  'platformId',
  'extra',
  'bus',
  'pins',
  'i2cAddr',
  'busFreq',
  'uartBaud'
];

interface AiConfigResponse {
  config: AiFormSnapshot | null;
}

const AI_PROTOCOLS = new Set<AiProtocol>(['openai', 'anthropic']);
const DEVICE_KINDS = new Set<DeviceKind>(['display', 'audio']);
const BUS_PROTOCOLS = new Set<BusProtocol>(['i2c', 'spi', 'i2s', 'pwm', 'dac', 'onewire', 'uart']);

function boundedString(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length <= max;
}

function validHttpUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol;
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

function validPins(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  return entries.length <= 64
    && entries.every(([key, pin]) => key.length <= 64 && boundedString(pin, 128));
}

function isAiFormSnapshot(value: unknown): value is AiFormSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const config = value as Record<string, unknown>;
  return typeof config.protocol === 'string'
    && AI_PROTOCOLS.has(config.protocol as AiProtocol)
    && boundedString(config.baseUrl, 2048)
    && validHttpUrl(config.baseUrl)
    && boundedString(config.apiKey, 4096)
    && boundedString(config.model, 256)
    && typeof config.deviceKind === 'string'
    && DEVICE_KINDS.has(config.deviceKind as DeviceKind)
    && boundedString(config.deviceId, 128)
    && boundedString(config.customDevice, 256)
    && boundedString(config.platformId, 128)
    && boundedString(config.extra, 4096)
    && typeof config.bus === 'string'
    && BUS_PROTOCOLS.has(config.bus as BusProtocol)
    && validPins(config.pins)
    && boundedString(config.i2cAddr, 32)
    && boundedString(config.busFreq, 32)
    && boundedString(config.uartBaud, 32);
}

function isAiConfigResponse(value: unknown): value is AiConfigResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const config = (value as { config?: unknown }).config;
  return config === null || isAiFormSnapshot(config);
}

function pinsEqual(left: Record<string, string>, right: Record<string, string>): boolean {
  const leftEntries = Object.entries(left);
  return leftEntries.length === Object.keys(right).length
    && leftEntries.every(([key, value]) => right[key] === value);
}

function formFieldChanged(field: AiFormField, current: AiFormSnapshot, previous: AiFormSnapshot): boolean {
  if (field === 'pins') return !pinsEqual(current.pins, previous.pins);
  return current[field] !== previous[field];
}

function mergeDirtyFields(
  server: AiFormSnapshot,
  local: AiFormSnapshot,
  dirtyFields: ReadonlySet<AiFormField>
): AiFormSnapshot {
  return {
    protocol: dirtyFields.has('protocol') ? local.protocol : server.protocol,
    baseUrl: dirtyFields.has('baseUrl') ? local.baseUrl : server.baseUrl,
    apiKey: dirtyFields.has('apiKey') ? local.apiKey : server.apiKey,
    model: dirtyFields.has('model') ? local.model : server.model,
    deviceKind: dirtyFields.has('deviceKind') ? local.deviceKind : server.deviceKind,
    deviceId: dirtyFields.has('deviceId') ? local.deviceId : server.deviceId,
    customDevice: dirtyFields.has('customDevice') ? local.customDevice : server.customDevice,
    platformId: dirtyFields.has('platformId') ? local.platformId : server.platformId,
    extra: dirtyFields.has('extra') ? local.extra : server.extra,
    bus: dirtyFields.has('bus') ? local.bus : server.bus,
    pins: { ...(dirtyFields.has('pins') ? local.pins : server.pins) },
    i2cAddr: dirtyFields.has('i2cAddr') ? local.i2cAddr : server.i2cAddr,
    busFreq: dirtyFields.has('busFreq') ? local.busFreq : server.busFreq,
    uartBaud: dirtyFields.has('uartBaud') ? local.uartBaud : server.uartBaud
  };
}

function defaultSnapshot(): AiFormSnapshot {
  return {
    protocol: 'openai',
    baseUrl: 'https://api.deepseek.com',
    apiKey: '',
    model: 'deepseek-chat',
    deviceKind: 'display',
    deviceId: 'ssd1306-i2c',
    customDevice: '',
    platformId: 'esp32-arduino',
    extra: '',
    bus: 'i2c',
    pins: defaultPins('esp32-arduino', 'i2c'),
    i2cAddr: '0x3C',
    busFreq: '400000',
    uartBaud: '115200'
  };
}

export const useAiAgentStore = defineStore('aiAgent', () => {
  // ── API configuration (persisted) ──
  const defaults = defaultSnapshot();
  const protocol = ref<AiProtocol>(defaults.protocol);
  const baseUrl = ref(defaults.baseUrl);
  const apiKey = ref(defaults.apiKey);
  const model = ref(defaults.model);

  // ── Input code ──
  const inputFiles = ref<InputCodeFile[]>([]);
  const pastedCode = ref('');

  // ── Model discovery ──
  // Pull the provider's available models from baseUrl + apiKey so the user can
  // pick from a live list instead of typing the id by hand.
  const availableModels = ref<string[]>([]);
  const fetchingModels = ref(false);
  const modelsError = ref('');
  const canFetchModels = computed(() => !!(baseUrl.value.trim() && apiKey.value.trim()) && !fetchingModels.value);
  let modelLoadToken = 0;
  let modelLoadController: AbortController | null = null;

  function invalidateModelLoad() {
    modelLoadToken += 1;
    modelLoadController?.abort();
    modelLoadController = null;
    availableModels.value = [];
    fetchingModels.value = false;
    modelsError.value = '';
  }

  async function loadModels() {
    if (!canFetchModels.value) return;
    const expectedGeneration = configGeneration;
    const userId = activeUserId;
    if (!userId || !isCurrent(expectedGeneration, userId)) return;
    const expectedModelLoad = ++modelLoadToken;
    modelLoadController?.abort();
    const controller = new AbortController();
    modelLoadController = controller;
    fetchingModels.value = true;
    modelsError.value = '';
    try {
      const ids = await fetchModels({
        protocol: protocol.value,
        baseUrl: baseUrl.value.trim(),
        apiKey: apiKey.value.trim(),
        signal: controller.signal
      });
      if (
        modelLoadToken !== expectedModelLoad
        || !isCurrent(expectedGeneration, userId)
      ) return;
      availableModels.value = ids;
      if (ids.length === 0) {
        modelsError.value = 'empty';
      } else if (!ids.includes(model.value)) {
        // Adopt the first model only if the current one isn't offered.
        model.value = ids[0];
      }
    } catch (error) {
      if (
        modelLoadToken !== expectedModelLoad
        || !isCurrent(expectedGeneration, userId)
      ) return;
      modelsError.value = error instanceof Error ? error.message : String(error);
    } finally {
      if (modelLoadToken === expectedModelLoad) {
        fetchingModels.value = false;
        if (modelLoadController === controller) modelLoadController = null;
      }
    }
  }

  // A changed endpoint invalidates the previously fetched list.
  watch([baseUrl, apiKey, protocol], invalidateModelLoad, { flush: 'sync' });

  async function addFiles(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      const content = await file.text();
      const existing = inputFiles.value.findIndex((f) => f.name === file.name);
      if (existing >= 0) inputFiles.value.splice(existing, 1);
      inputFiles.value.push({ name: file.name, content });
    }
  }

  function removeFile(index: number) {
    inputFiles.value.splice(index, 1);
  }

  // ── Target selection ──
  const deviceKind = ref<DeviceKind>(defaults.deviceKind);
  const deviceId = ref(defaults.deviceId);
  const customDevice = ref(defaults.customDevice);
  const platformId = ref(defaults.platformId);
  const extra = ref(defaults.extra);

  // ── Bus / wiring ──
  const bus = ref<BusProtocol>(defaults.bus);
  const pins = ref<Record<string, string>>({ ...defaults.pins });
  const i2cAddr = ref(defaults.i2cAddr);
  const busFreq = ref(defaults.busFreq);
  const uartBaud = ref(defaults.uartBaud);

  const busPreset = computed(() => BUS_PRESETS.find((b) => b.id === bus.value) ?? BUS_PRESETS[0]);

  function applyBusDefaults() {
    pins.value = defaultPins(platformId.value, bus.value);
    const extras = busPreset.value.extras;
    const addr = extras.find((e) => e.key === 'addr');
    const freq = extras.find((e) => e.key === 'freq');
    const baud = extras.find((e) => e.key === 'baud');
    if (addr) i2cAddr.value = addr.default;
    if (freq) busFreq.value = freq.default;
    if (baud) uartBaud.value = baud.default;
  }

  // Device presets carry their natural bus; adopt it on device change.
  watch(deviceId, (id) => {
    const device = DEVICE_PRESETS.find((d) => d.id === id);
    if (device?.bus && device.bus !== bus.value) {
      bus.value = device.bus;
      // Device-specific I2C address defaults stay simple: SSD1306 is 0x3C.
    }
  });

  watch([bus, platformId], () => applyBusDefaults());

  const devicesForKind = computed(() =>
    DEVICE_PRESETS.filter((d) => d.kind === deviceKind.value || d.id === 'custom')
  );

  // Keep the selection valid when the kind flips.
  watch(deviceKind, (kind) => {
    const current = DEVICE_PRESETS.find((d) => d.id === deviceId.value);
    if (!current || (current.kind !== kind && current.id !== 'custom')) {
      deviceId.value = kind === 'display' ? 'ssd1306-i2c' : 'pwm-buzzer';
    }
  });

  // ── Per-account server persistence of the whole AI form ──
  const auth = useAuthStore();
  const configErrorKey = ref<MessageKey | null>(null);
  const configError = computed(() => configErrorKey.value ? t(configErrorKey.value) : '');
  let configErrorKind: 'load' | 'save' | null = null;
  let activeUserId: string | null = null;
  let configGeneration = 0;
  let loadSequence = 0;
  let applyingSnapshot = 0;
  let loadController: AbortController | null = null;

  interface PendingSave {
    value: AiFormSnapshot;
    revision: number;
  }

  interface SaveState {
    generation: number;
    userId: string | null;
    dirtyRevision: number;
    dirtyFields: Set<AiFormField>;
    loadPending: boolean;
    pending: PendingSave | null;
    halted: boolean;
    timer: ReturnType<typeof setTimeout> | null;
    controller: AbortController | null;
    drainPromise: Promise<void> | null;
  }

  function createSaveState(generation: number, userId: string | null): SaveState {
    return {
      generation,
      userId,
      dirtyRevision: 0,
      dirtyFields: new Set(),
      loadPending: userId !== null,
      pending: null,
      halted: false,
      timer: null,
      controller: null,
      drainPromise: null
    };
  }

  let saveState = createSaveState(configGeneration, null);

  function snapshot(): AiFormSnapshot {
    return {
      protocol: protocol.value,
      baseUrl: baseUrl.value,
      apiKey: apiKey.value,
      model: model.value,
      deviceKind: deviceKind.value,
      deviceId: deviceId.value,
      customDevice: customDevice.value,
      platformId: platformId.value,
      extra: extra.value,
      bus: bus.value,
      pins: { ...pins.value },
      i2cAddr: i2cAddr.value,
      busFreq: busFreq.value,
      uartBaud: uartBaud.value
    };
  }

  function isCurrent(expectedGeneration: number, userId: string): boolean {
    return configGeneration === expectedGeneration
      && activeUserId === userId
      && auth.status === 'authenticated'
      && auth.currentUser?.id === userId;
  }

  function assignBaseSnapshot(value: AiFormSnapshot) {
    protocol.value = value.protocol;
    baseUrl.value = value.baseUrl;
    apiKey.value = value.apiKey;
    model.value = value.model;
    deviceKind.value = value.deviceKind;
    deviceId.value = value.deviceId;
    customDevice.value = value.customDevice;
    platformId.value = value.platformId;
    extra.value = value.extra;
  }

  function assignWiringSnapshot(value: AiFormSnapshot) {
    pins.value = { ...value.pins };
    i2cAddr.value = value.i2cAddr;
    busFreq.value = value.busFreq;
    uartBaud.value = value.uartBaud;
  }

  function resetFormImmediately() {
    applyingSnapshot += 1;
    try {
      const value = defaultSnapshot();
      assignBaseSnapshot(value);
      bus.value = value.bus;
      assignWiringSnapshot(value);
    } finally {
      applyingSnapshot -= 1;
    }
  }

  async function applySnapshot(value: AiFormSnapshot, expectedGeneration: number, userId: string) {
    applyingSnapshot += 1;
    try {
      if (!isCurrent(expectedGeneration, userId)) return;
      assignBaseSnapshot(value);
      await nextTick();
      if (!isCurrent(expectedGeneration, userId)) return;
      bus.value = value.bus;
      await nextTick();
      if (!isCurrent(expectedGeneration, userId)) return;
      assignWiringSnapshot(value);
      await nextTick();
    } finally {
      applyingSnapshot -= 1;
    }
  }

  function isSaveStateCurrent(state: SaveState): state is SaveState & { userId: string } {
    return saveState === state
      && state.userId !== null
      && isCurrent(state.generation, state.userId);
  }

  function cancelSaveState(state: SaveState) {
    if (state.timer) clearTimeout(state.timer);
    state.timer = null;
    state.controller?.abort();
    state.controller = null;
    state.pending = null;
    state.halted = true;
  }

  function finishConfigLoad(state: SaveState) {
    if (!isSaveStateCurrent(state)) return;
    state.loadPending = false;
    if (state.pending && !state.timer && !state.halted) void drainSaveState(state);
  }

  async function loadConfig(): Promise<void> {
    const userId = activeUserId;
    const expectedGeneration = configGeneration;
    if (!userId || !isCurrent(expectedGeneration, userId)) return;
    const state = saveState;
    if (!isSaveStateCurrent(state)) return;
    state.loadPending = true;
    const expectedLoad = ++loadSequence;
    loadController?.abort();
    const controller = new AbortController();
    loadController = controller;
    try {
      const response = await request<AiConfigResponse>('/api/me/ai-config', {
        signal: controller.signal,
        validate: isAiConfigResponse
      });
      if (!isCurrent(expectedGeneration, userId) || loadSequence !== expectedLoad) return;
      const dirtyFields = new Set(state.dirtyFields);
      const merged = mergeDirtyFields(response.config ?? defaultSnapshot(), snapshot(), dirtyFields);
      await applySnapshot(merged, expectedGeneration, userId);
      if (!isCurrent(expectedGeneration, userId) || loadSequence !== expectedLoad) return;
      if (dirtyFields.size > 0) {
        state.pending = { value: snapshot(), revision: state.dirtyRevision };
      }
      state.dirtyFields.clear();
      if (configErrorKind === 'load') {
        configErrorKind = null;
        configErrorKey.value = null;
      }
      finishConfigLoad(state);
    } catch {
      if (!isCurrent(expectedGeneration, userId) || loadSequence !== expectedLoad) return;
      configErrorKind = 'load';
      configErrorKey.value = 'ai.configLoadFailed';
    } finally {
      if (loadController === controller) loadController = null;
    }
  }

  async function runSaveLoop(state: SaveState): Promise<void> {
    while (
      isSaveStateCurrent(state)
      && !state.halted
      && !state.loadPending
      && !state.timer
      && state.pending
    ) {
      const pending = state.pending;
      state.pending = null;
      const controller = new AbortController();
      state.controller = controller;
      try {
        await request<void>('/api/me/ai-config', {
          method: 'PUT',
          body: pending.value,
          signal: controller.signal
        });
        if (!isSaveStateCurrent(state)) return;
        if (configErrorKind === 'save') {
          configErrorKind = null;
          configErrorKey.value = null;
        }
      } catch {
        if (!isSaveStateCurrent(state)) return;
        if (state.timer) clearTimeout(state.timer);
        state.timer = null;
        state.pending = { value: snapshot(), revision: state.dirtyRevision };
        state.halted = true;
        configErrorKind = 'save';
        configErrorKey.value = 'ai.configSaveFailed';
        return;
      } finally {
        if (state.controller === controller) state.controller = null;
      }
    }
  }

  async function drainSaveState(state: SaveState): Promise<void> {
    if (state.drainPromise) return state.drainPromise;
    const run = runSaveLoop(state);
    state.drainPromise = run;
    try {
      await run;
    } finally {
      if (state.drainPromise === run) state.drainPromise = null;
    }
  }

  function scheduleSave(state: SaveState) {
    if (!isSaveStateCurrent(state)) return;
    if (state.halted) {
      state.pending = { value: snapshot(), revision: state.dirtyRevision };
      return;
    }
    if (state.timer) clearTimeout(state.timer);
    state.timer = setTimeout(() => {
      state.timer = null;
      if (!isSaveStateCurrent(state)) return;
      state.pending = { value: snapshot(), revision: state.dirtyRevision };
      if (!state.loadPending) void drainSaveState(state);
    }, 400);
  }

  async function retryConfig(): Promise<void> {
    if (configErrorKind === 'load') {
      await loadConfig();
      return;
    }
    if (configErrorKind !== 'save') return;
    const state = saveState;
    if (!isSaveStateCurrent(state)) return;
    if (state.drainPromise) await state.drainPromise;
    if (!isSaveStateCurrent(state)) return;
    if (state.timer) clearTimeout(state.timer);
    state.timer = null;
    state.pending = { value: snapshot(), revision: state.dirtyRevision };
    state.halted = false;
    await drainSaveState(state);
  }

  watch(
    snapshot,
    (current, previous) => {
      if (applyingSnapshot > 0) return;
      const changedFields = AI_FORM_FIELDS.filter((field) => formFieldChanged(field, current, previous));
      if (changedFields.length === 0) return;
      const state = saveState;
      if (!isSaveStateCurrent(state)) return;
      if (state.loadPending) {
        for (const field of changedFields) state.dirtyFields.add(field);
      }
      state.dirtyRevision += 1;
      scheduleSave(state);
    },
    { flush: 'sync' }
  );

  // ── Generation ──
  const isGenerating = ref(false);
  const streamText = ref('');
  const errorMessage = ref('');
  const selectedFileIndex = ref(0);
  let abortController: AbortController | null = null;

  const effectiveFiles = computed<InputCodeFile[]>(() => {
    const files = [...inputFiles.value];
    if (pastedCode.value.trim()) files.push({ name: 'pasted_data.h', content: pastedCode.value });
    return files;
  });

  const hasInput = computed(() => effectiveFiles.value.length > 0);
  const configReady = computed(() => !!(baseUrl.value.trim() && apiKey.value.trim() && model.value.trim()));
  const canGenerate = computed(() => hasInput.value && configReady.value && !isGenerating.value);

  const generatedFiles = computed(() => (streamText.value ? parseGeneratedFiles(streamText.value) : []));

  const prompt = computed(() => {
    const device = DEVICE_PRESETS.find((d) => d.id === deviceId.value) ?? DEVICE_PRESETS[0];
    const platform = PLATFORM_PRESETS.find((p) => p.id === platformId.value) ?? PLATFORM_PRESETS[0];
    const isCustom = device.id === 'custom';
    const preset = busPreset.value;
    const wiringExtras: { label: string; value: string }[] = [];
    for (const field of preset.extras) {
      if (field.key === 'addr') wiringExtras.push({ label: 'I2C address', value: i2cAddr.value });
      if (field.key === 'freq') wiringExtras.push({ label: 'Bus frequency (Hz)', value: busFreq.value });
      if (field.key === 'baud') wiringExtras.push({ label: 'Baud rate', value: uartBaud.value });
    }
    return buildIntegrationPrompt({
      files: effectiveFiles.value,
      deviceKind: deviceKind.value,
      deviceLabel: isCustom ? customDevice.value || 'custom device (see extra requirements)' : device.label,
      deviceHint: isCustom ? '' : device.hint,
      platformLabel: platform.label,
      platformHint: platform.hint,
      busLabel: preset.label,
      pins: preset.pins.map((p) => ({ label: p.label, value: pins.value[p.key] ?? '' })),
      wiringExtras,
      extra: extra.value,
      locale: locale.value
    });
  });

  const promptSize = computed(() => prompt.value.system.length + prompt.value.user.length);

  // Conversation history enabling follow-up "refine" turns.
  let history: ChatMessage[] = [];
  let systemPrompt = '';
  const canRefine = computed(() => !isGenerating.value && generatedFiles.value.length > 0 && configReady.value);
  const refineInstruction = ref('');

  async function runStream() {
    errorMessage.value = '';
    streamText.value = '';
    selectedFileIndex.value = 0;
    isGenerating.value = true;
    abortController = new AbortController();
    try {
      const full = await streamChat(
        { protocol: protocol.value, baseUrl: baseUrl.value.trim(), apiKey: apiKey.value.trim(), model: model.value.trim() },
        systemPrompt,
        history,
        (piece) => {
          streamText.value += piece;
        },
        abortController.signal
      );
      history.push({ role: 'assistant', content: full });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        errorMessage.value = error instanceof Error ? error.message : String(error);
      }
      // Drop the failed turn so a retry doesn't duplicate it.
      if (history[history.length - 1]?.role === 'user') history.pop();
    } finally {
      isGenerating.value = false;
      abortController = null;
    }
  }

  async function generate() {
    if (!canGenerate.value) return;
    const { system, user } = prompt.value;
    systemPrompt = system;
    history = [{ role: 'user', content: user }];
    await runStream();
  }

  /** Follow-up turn: ask the model to revise its previous output. */
  async function refine() {
    const instruction = refineInstruction.value.trim();
    if (!instruction || !canRefine.value) return;
    history.push({ role: 'user', content: buildRefineMessage(instruction) });
    refineInstruction.value = '';
    await runStream();
  }

  function stop() {
    abortController?.abort();
  }

  function downloadFile(index: number) {
    const file = generatedFiles.value[index];
    if (!file) return;
    const url = URL.createObjectURL(makeTextBlob(file.content));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function downloadAll() {
    generatedFiles.value.forEach((_, index) => setTimeout(() => downloadFile(index), index * 250));
  }

  function clearOutput() {
    streamText.value = '';
    errorMessage.value = '';
    selectedFileIndex.value = 0;
    history = [];
    refineInstruction.value = '';
  }

  function clearAccountState() {
    loadController?.abort();
    loadController = null;
    stop();
    isGenerating.value = false;
    inputFiles.value = [];
    pastedCode.value = '';
    invalidateModelLoad();
    clearOutput();
    systemPrompt = '';
    resetFormImmediately();
  }

  watch(
    () => auth.status === 'authenticated' ? auth.currentUser?.id ?? null : null,
    (userId) => {
      cancelSaveState(saveState);
      configGeneration += 1;
      loadSequence += 1;
      activeUserId = userId;
      saveState = createSaveState(configGeneration, userId);
      configErrorKind = null;
      configErrorKey.value = null;
      clearAccountState();
      if (userId) void loadConfig();
    },
    { immediate: true, flush: 'sync' }
  );

  return {
    protocol,
    baseUrl,
    apiKey,
    model,
    inputFiles,
    pastedCode,
    availableModels,
    fetchingModels,
    modelsError,
    configError,
    canFetchModels,
    loadModels,
    loadConfig,
    retryConfig,
    deviceKind,
    deviceId,
    customDevice,
    platformId,
    extra,
    bus,
    pins,
    i2cAddr,
    busFreq,
    uartBaud,
    busPreset,
    devicesForKind,
    isGenerating,
    streamText,
    errorMessage,
    selectedFileIndex,
    hasInput,
    configReady,
    canGenerate,
    canRefine,
    refineInstruction,
    generatedFiles,
    promptSize,
    addFiles,
    removeFile,
    generate,
    refine,
    stop,
    downloadFile,
    downloadAll,
    clearOutput
  };
});
