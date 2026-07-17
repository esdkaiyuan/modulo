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
import { dbGetAiConfig, dbSaveAiConfig } from '../../../user/localDb';
import { locale } from '../../../i18n';

const CONFIG_KEY = 'dms-ai-config';

interface StoredConfig {
  protocol: AiProtocol;
  baseUrl: string;
  apiKey: string;
  model: string;
}

function loadConfig(): StoredConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    // SECURITY: the API key is intentionally never read from (or written to)
    // the shared localStorage config — it lives only in the per-account
    // IndexedDB record, so guests and other accounts can't inherit it.
    if (raw) {
      const parsed = { protocol: 'openai', baseUrl: '', model: '', ...JSON.parse(raw) };
      if ('apiKey' in parsed) {
        // One-time scrub of keys written by older versions.
        localStorage.setItem(
          CONFIG_KEY,
          JSON.stringify({ protocol: parsed.protocol, baseUrl: parsed.baseUrl, model: parsed.model })
        );
      }
      return { protocol: parsed.protocol, baseUrl: parsed.baseUrl, apiKey: '', model: parsed.model };
    }
  } catch {
    /* corrupt config — fall through to defaults */
  }
  return { protocol: 'openai', baseUrl: 'https://api.deepseek.com', apiKey: '', model: 'deepseek-chat' };
}

/** Every user-entered AI form field that should follow the account. Excludes
 *  input code, streamed output, and generated files (those are "content"). */
interface AiFormSnapshot {
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

export const useAiAgentStore = defineStore('aiAgent', () => {
  // ── API configuration (persisted) ──
  const stored = loadConfig();
  const protocol = ref<AiProtocol>(stored.protocol);
  const baseUrl = ref(stored.baseUrl);
  const apiKey = ref(stored.apiKey);
  const model = ref(stored.model);

  // Shared (non-account) convenience config — never includes the API key.
  watch([protocol, baseUrl, model], () => {
    localStorage.setItem(
      CONFIG_KEY,
      JSON.stringify({ protocol: protocol.value, baseUrl: baseUrl.value, model: model.value })
    );
  });

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

  async function loadModels() {
    if (!canFetchModels.value) return;
    fetchingModels.value = true;
    modelsError.value = '';
    try {
      const ids = await fetchModels({
        protocol: protocol.value,
        baseUrl: baseUrl.value.trim(),
        apiKey: apiKey.value.trim()
      });
      availableModels.value = ids;
      if (ids.length === 0) {
        modelsError.value = 'empty';
      } else if (!ids.includes(model.value)) {
        // Adopt the first model only if the current one isn't offered.
        model.value = ids[0];
      }
    } catch (error) {
      modelsError.value = error instanceof Error ? error.message : String(error);
    } finally {
      fetchingModels.value = false;
    }
  }

  // A changed endpoint invalidates the previously fetched list.
  watch([baseUrl, apiKey, protocol], () => {
    availableModels.value = [];
    modelsError.value = '';
  });

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
  const deviceKind = ref<DeviceKind>('display');
  const deviceId = ref('ssd1306-i2c');
  const customDevice = ref('');
  const platformId = ref('esp32-arduino');
  const extra = ref('');

  // ── Bus / wiring ──
  const bus = ref<BusProtocol>('i2c');
  const pins = ref<Record<string, string>>(defaultPins('esp32-arduino', 'i2c'));
  const i2cAddr = ref('0x3C');
  const busFreq = ref('400000');
  const uartBaud = ref('115200');

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

  // ── Per-account persistence of the whole AI form ──
  // The AI tool's form (API keys, target device, protocol, pins, requirements)
  // follows the logged-in user via IndexedDB, so returning users can generate
  // immediately without re-entering everything. `restoring` suppresses the
  // save watcher while we apply a saved snapshot.
  const auth = useAuthStore();
  let restoring = false;

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

  async function applySnapshot(snap: Partial<AiFormSnapshot>) {
    restoring = true;
    // Base fields first; their watchers reset pins/bus defaults on nextTick.
    if (snap.protocol) protocol.value = snap.protocol;
    if (snap.baseUrl !== undefined) baseUrl.value = snap.baseUrl;
    if (snap.apiKey !== undefined) apiKey.value = snap.apiKey;
    if (snap.model !== undefined) model.value = snap.model;
    if (snap.deviceKind) deviceKind.value = snap.deviceKind;
    if (snap.deviceId) deviceId.value = snap.deviceId;
    if (snap.customDevice !== undefined) customDevice.value = snap.customDevice;
    if (snap.platformId) platformId.value = snap.platformId;
    if (snap.extra !== undefined) extra.value = snap.extra;
    if (snap.bus) bus.value = snap.bus;
    await nextTick();
    // Now override the derived wiring fields the watchers just reset.
    if (snap.pins) pins.value = { ...snap.pins };
    if (snap.i2cAddr !== undefined) i2cAddr.value = snap.i2cAddr;
    if (snap.busFreq !== undefined) busFreq.value = snap.busFreq;
    if (snap.uartBaud !== undefined) uartBaud.value = snap.uartBaud;
    await nextTick();
    restoring = false;
  }

  // Load the saved form whenever the logged-in user changes; clear back to
  // defaults on logout so the next person doesn't inherit stale keys.
  const defaults = snapshot();
  watch(
    () => auth.currentUser?.id,
    async (uid) => {
      if (!uid) {
        // Belt and braces: the key must never survive a logout.
        await applySnapshot({ ...defaults, apiKey: '' });
        return;
      }
      const saved = await dbGetAiConfig(uid);
      if (saved) {
        const { userId: _omit, ...form } = saved;
        await applySnapshot(form as Partial<AiFormSnapshot>);
      }
    },
    { immediate: true }
  );

  // Persist any form change for the current user (debounced via microtask
  // coalescing is unnecessary — writes are cheap and best-effort).
  watch(
    () => JSON.stringify(snapshot()),
    () => {
      if (restoring) return;
      const uid = auth.currentUser?.id;
      if (!uid) return;
      void dbSaveAiConfig({ userId: uid, ...snapshot() });
    }
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
    canFetchModels,
    loadModels,
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
