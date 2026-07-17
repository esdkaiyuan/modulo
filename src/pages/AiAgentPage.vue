<script setup lang="ts">
import { computed, ref } from 'vue';
import Panel from '../components/Panel.vue';
import { BUS_PRESETS, PLATFORM_PRESETS, PROVIDER_PRESETS } from '../engines/aiClient';
import { useAiAgentStore } from '../features/aiagent/stores/aiAgentStore';
import { t } from '../i18n';
import type { MessageKey } from '../i18n/messages';

const store = useAiAgentStore();
const fileInput = ref<HTMLInputElement | null>(null);
const dragOver = ref(false);
const copiedIndex = ref(-1);

// Custom model dropdown (native <datalist> mispositions inside the flex row).
const modelMenuOpen = ref(false);
const filteredModels = computed(() => {
  const q = store.model.trim().toLowerCase();
  const all = store.availableModels;
  if (!q) return all;
  const matches = all.filter((m) => m.toLowerCase().includes(q));
  // If the query exactly equals the only match, no point showing the menu.
  return matches;
});

function openModelMenu() {
  if (store.availableModels.length) modelMenuOpen.value = true;
}

function pickModel(m: string) {
  store.model = m;
  modelMenuOpen.value = false;
}

// Delay close so a click on a menu item registers before blur hides it.
function closeModelMenu() {
  window.setTimeout(() => {
    modelMenuOpen.value = false;
  }, 120);
}

const selectedFile = computed(() => store.generatedFiles[store.selectedFileIndex] ?? store.generatedFiles[0] ?? null);

// Quick requirement chips appended to the extra-requirements box.
const QUICK_REQS: { key: MessageKey }[] = [
  { key: 'ai.quickDoubleBuffer' },
  { key: 'ai.quickAnimLoop' },
  { key: 'ai.quickDma' },
  { key: 'ai.quickNonBlocking' },
  { key: 'ai.quickBrightness' },
  { key: 'ai.quickPlatformio' }
];

function addQuickReq(key: MessageKey) {
  const text = t(key);
  if (store.extra.includes(text)) return;
  store.extra = store.extra.trim() ? `${store.extra.trim()}\n${text}` : text;
}

function pickFiles() {
  fileInput.value?.click();
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files?.length) await store.addFiles(input.files);
  input.value = '';
}

async function onDrop(e: DragEvent) {
  dragOver.value = false;
  if (e.dataTransfer?.files.length) await store.addFiles(e.dataTransfer.files);
}

function applyProvider(id: string) {
  const preset = PROVIDER_PRESETS.find((p) => p.id === id);
  if (!preset) return;
  store.protocol = preset.protocol;
  store.baseUrl = preset.baseUrl;
  store.model = preset.model;
}

async function copyFile(index: number) {
  const file = store.generatedFiles[index];
  if (!file) return;
  await navigator.clipboard.writeText(file.content);
  copiedIndex.value = index;
  setTimeout(() => { copiedIndex.value = -1; }, 1500);
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-toolbar">
      <span class="tool-title">{{ t('ai.title') }}</span>
      <button
        class="btn primary"
        data-test="ai-generate"
        :disabled="!store.canGenerate"
        @click="store.generate()"
      >
        {{ store.isGenerating ? t('ai.generating') : t('ai.generate') }}
      </button>
      <button v-if="store.isGenerating" class="btn" data-test="ai-stop" @click="store.stop()">{{ t('ai.stop') }}</button>
      <button class="btn" :disabled="!store.streamText" @click="store.clearOutput()">{{ t('common.reset') }}</button>
      <span class="toolbar-spacer"></span>
      <span class="toolbar-info">
        <template v-if="!store.configReady">{{ t('ai.errorNoKey') }}</template>
        <template v-else-if="!store.hasInput">{{ t('ai.errorNoInput') }}</template>
        <template v-else>{{ t('ai.promptSize', { n: (store.promptSize / 1000).toFixed(1) }) }}</template>
      </span>
    </div>

    <div class="tool-main">
      <Panel :title="t('ai.input')">
        <div
          class="drop-zone"
          :class="{ over: dragOver }"
          data-test="ai-drop"
          @click="pickFiles"
          @dragover.prevent="dragOver = true"
          @dragleave="dragOver = false"
          @drop.prevent="onDrop"
        >
          <span class="big">✦</span>
          <b>{{ t('ai.drop') }}</b>
          <span>{{ t('ai.dropTypes') }}</span>
        </div>
        <div v-if="store.inputFiles.length" class="ai-file-chips">
          <span v-for="(file, i) in store.inputFiles" :key="file.name" class="ai-file-chip" :data-test="`ai-file-${i}`">
            {{ file.name }} · {{ (file.content.length / 1024).toFixed(1) }} KB
            <button class="chip-remove" :title="t('ai.remove')" @click.stop="store.removeFile(i)">×</button>
          </span>
        </div>
        <label class="field" style="margin-top:10px">
          <span>{{ t('ai.paste') }}</span>
          <textarea
            v-model="store.pastedCode"
            class="ai-textarea"
            rows="6"
            data-test="ai-paste"
            :placeholder="t('ai.pastePlaceholder')"
          ></textarea>
        </label>
      </Panel>

      <Panel :title="t('ai.output')">
        <div v-if="store.errorMessage" class="alert-error">{{ store.errorMessage }}</div>

        <div v-if="!store.streamText && !store.isGenerating" class="empty-state">
          <span class="big">✦</span>
          <span>{{ t('ai.emptyOutput') }}</span>
        </div>

        <template v-else>
          <div v-if="store.generatedFiles.length" class="ai-file-tabs" data-test="ai-file-tabs">
            <button
              v-for="(file, i) in store.generatedFiles"
              :key="`${i}-${file.name}`"
              class="ai-file-tab"
              :class="{ active: store.selectedFileIndex === i }"
              @click="store.selectedFileIndex = i"
            >
              {{ file.name }}
            </button>
          </div>

          <section v-if="selectedFile" class="code-panel" data-test="ai-code">
            <header class="code-head">
              <span class="code-title">{{ selectedFile.name }}</span>
              <span class="code-meta">
                {{ (selectedFile.content.length / 1024).toFixed(1) }} KB
                <template v-if="store.isGenerating"> · {{ t('ai.generating') }}</template>
              </span>
              <div class="panel-actions">
                <button class="code-btn" @click="copyFile(store.selectedFileIndex)">
                  {{ copiedIndex === store.selectedFileIndex ? t('code.copied') : t('code.copy') }}
                </button>
                <button class="code-btn accent" @click="store.downloadFile(store.selectedFileIndex)">{{ t('code.download') }}</button>
                <button v-if="store.generatedFiles.length > 1" class="code-btn" @click="store.downloadAll()">{{ t('ai.downloadAll') }}</button>
              </div>
            </header>
            <pre class="code-body"><code>{{ selectedFile.content }}</code></pre>
          </section>

          <pre v-else class="code-body ai-stream" data-test="ai-stream"><code>{{ store.streamText || '…' }}</code></pre>

          <div v-if="store.canRefine" class="ai-refine-row" data-test="ai-refine-row">
            <input
              v-model="store.refineInstruction"
              type="text"
              data-test="ai-refine-input"
              :placeholder="t('ai.refinePlaceholder')"
              @keydown.enter="store.refine()"
            />
            <button class="btn primary" data-test="ai-refine" :disabled="!store.refineInstruction.trim()" @click="store.refine()">
              {{ t('ai.refine') }}
            </button>
          </div>
        </template>
      </Panel>
    </div>

    <aside class="tool-side">
      <Panel :title="t('ai.config')">
        <div class="field-stack">
          <div class="ai-provider-row">
            <button
              v-for="preset in PROVIDER_PRESETS"
              :key="preset.id"
              class="btn sm"
              :data-test="`ai-provider-${preset.id}`"
              @click="applyProvider(preset.id)"
            >
              {{ preset.label }}
            </button>
          </div>
          <label class="field">
            <span>{{ t('ai.protocol') }}</span>
            <select v-model="store.protocol" data-test="ai-protocol">
              <option value="openai">{{ t('ai.protocolOpenai') }}</option>
              <option value="anthropic">{{ t('ai.protocolAnthropic') }}</option>
            </select>
          </label>
          <label class="field">
            <span>{{ t('ai.baseUrl') }}</span>
            <input v-model="store.baseUrl" type="text" data-test="ai-base-url" placeholder="https://api.deepseek.com" />
          </label>
          <label class="field">
            <span>{{ t('ai.apiKey') }}</span>
            <input v-model="store.apiKey" type="password" data-test="ai-api-key" autocomplete="off" placeholder="sk-…" />
          </label>
          <label class="field">
            <span>{{ t('ai.model') }}</span>
            <div class="ai-model-row">
              <div class="ai-model-input">
                <input
                  v-model="store.model"
                  type="text"
                  data-test="ai-model"
                  placeholder="deepseek-chat"
                  autocomplete="off"
                  @focus="openModelMenu"
                  @input="openModelMenu"
                  @blur="closeModelMenu"
                />
                <ul
                  v-if="modelMenuOpen && filteredModels.length"
                  class="ai-model-menu"
                  data-test="ai-model-menu"
                >
                  <li
                    v-for="m in filteredModels"
                    :key="m"
                    class="ai-model-option"
                    :class="{ active: m === store.model }"
                    :data-test="`ai-model-option-${m}`"
                    @mousedown.prevent="pickModel(m)"
                  >
                    {{ m }}
                  </li>
                </ul>
              </div>
              <button
                class="btn sm"
                type="button"
                data-test="ai-fetch-models"
                :disabled="!store.canFetchModels"
                :title="t('ai.fetchModelsHint')"
                @click="store.loadModels()"
              >
                {{ store.fetchingModels ? t('ai.fetchingModels') : t('ai.fetchModels') }}
              </button>
            </div>
          </label>
          <p
            v-if="store.availableModels.length"
            class="ai-hint ai-models-ok"
            data-test="ai-models-count"
          >
            {{ t('ai.modelsFound', { n: store.availableModels.length }) }}
          </p>
          <p
            v-else-if="store.modelsError === 'empty'"
            class="ai-hint ai-models-err"
            data-test="ai-models-error"
          >
            {{ t('ai.modelsEmpty') }}
          </p>
          <p
            v-else-if="store.modelsError"
            class="ai-hint ai-models-err"
            data-test="ai-models-error"
          >
            {{ t('ai.modelsError') }}: {{ store.modelsError }}
          </p>
          <p class="ai-hint">{{ t('ai.apiKeyHint') }}</p>
        </div>
      </Panel>

      <Panel :title="t('ai.target')">
        <div class="field-stack">
          <label class="field">
            <span>{{ t('ai.deviceKind') }}</span>
            <select v-model="store.deviceKind" data-test="ai-kind">
              <option value="display">{{ t('ai.kindDisplay') }}</option>
              <option value="audio">{{ t('ai.kindAudio') }}</option>
            </select>
          </label>
          <label class="field">
            <span>{{ t('ai.device') }}</span>
            <select v-model="store.deviceId" data-test="ai-device">
              <option v-for="device in store.devicesForKind" :key="device.id" :value="device.id">
                {{ device.id === 'custom' ? t('ai.customDevice') : device.label }}
              </option>
            </select>
          </label>
          <label v-if="store.deviceId === 'custom'" class="field">
            <span>{{ t('ai.customDevice') }}</span>
            <input v-model="store.customDevice" type="text" data-test="ai-custom-device" :placeholder="t('ai.customDevicePlaceholder')" />
          </label>
          <label class="field">
            <span>{{ t('ai.platform') }}</span>
            <select v-model="store.platformId" data-test="ai-platform">
              <option v-for="platform in PLATFORM_PRESETS" :key="platform.id" :value="platform.id">{{ platform.label }}</option>
            </select>
          </label>
        </div>
      </Panel>

      <Panel :title="t('ai.wiring')">
        <div class="field-stack">
          <label class="field">
            <span>{{ t('ai.bus') }}</span>
            <select v-model="store.bus" data-test="ai-bus">
              <option v-for="preset in BUS_PRESETS" :key="preset.id" :value="preset.id">{{ preset.label }}</option>
            </select>
          </label>
          <div class="ai-pin-grid" data-test="ai-pins">
            <label v-for="pin in store.busPreset.pins" :key="pin.key" class="field">
              <span>{{ pin.label }}{{ pin.optional ? ` (${t('ai.pinOptional')})` : '' }}</span>
              <input v-model="store.pins[pin.key]" type="text" :data-test="`ai-pin-${pin.key}`" />
            </label>
            <label v-if="store.busPreset.extras.some(e => e.key === 'addr')" class="field">
              <span>{{ t('ai.i2cAddr') }}</span>
              <input v-model="store.i2cAddr" type="text" data-test="ai-i2c-addr" placeholder="0x3C" />
            </label>
            <label v-if="store.busPreset.extras.some(e => e.key === 'freq')" class="field">
              <span>{{ t('ai.busFreq') }}</span>
              <input v-model="store.busFreq" type="text" data-test="ai-bus-freq" placeholder="400000" />
            </label>
            <label v-if="store.busPreset.extras.some(e => e.key === 'baud')" class="field">
              <span>{{ t('ai.baud') }}</span>
              <input v-model="store.uartBaud" type="text" data-test="ai-baud" placeholder="115200" />
            </label>
          </div>
          <p class="ai-hint">{{ t('ai.wiringHint') }}</p>
        </div>
      </Panel>

      <Panel :title="t('ai.extraTitle')">
        <div class="ai-quick-row">
          <button
            v-for="req in QUICK_REQS"
            :key="req.key"
            class="ai-quick-chip"
            :data-test="`ai-quick-${req.key.split('.')[1]}`"
            @click="addQuickReq(req.key)"
          >
            + {{ t(req.key) }}
          </button>
        </div>
        <textarea
          v-model="store.extra"
          class="ai-textarea"
          rows="5"
          data-test="ai-extra"
          :placeholder="t('ai.extraPlaceholder')"
        ></textarea>
      </Panel>
    </aside>

    <input ref="fileInput" type="file" class="hidden-input" accept=".h,.c,.hpp,.cpp,.txt,.ino,.py,.json" multiple @change="onFileChange" />
  </div>
</template>
