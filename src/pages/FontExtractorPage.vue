<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import Panel from '../components/Panel.vue';
import BitmapCanvas from '../components/BitmapCanvas.vue';
import CodeOutput from '../components/CodeOutput.vue';
import EncodingFields from '../components/EncodingFields.vue';
import { useFontModuloStore } from '../features/font/stores/fontModuloStore';

const store = useFontModuloStore();
const fontInput = ref<HTMLInputElement | null>(null);
const fontError = ref('');
const customFonts = ref<string[]>([]);

const BUILTIN_FONTS = [
  { value: 'Noto Sans CJK SC, Microsoft YaHei, SimSun, sans-serif', label: 'Noto Sans CJK / 雅黑' },
  { value: 'SimSun, serif', label: 'SimSun 宋体' },
  { value: 'KaiTi, STKaiti, serif', label: 'KaiTi 楷体' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Courier New, monospace', label: 'Courier New' }
];

const previewScale = computed(() => {
  const max = Math.max(store.targetWidth, store.targetHeight);
  return max <= 32 ? 8 : max <= 64 ? 5 : 3;
});

const exportPayload = computed(() =>
  store.glyphs.length > 1
    ? { frames: store.glyphs.map((g) => Array.from(g.bytes)) }
    : { bytes: Array.from(store.bytes) }
);

function pickFont() {
  fontInput.value?.click();
}

async function onFontFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  fontError.value = '';
  try {
    const family = `Custom-${file.name.replace(/\.[^.]+$/, '').replace(/[^\w-]/g, '_')}`;
    const face = new FontFace(family, await file.arrayBuffer());
    await face.load();
    document.fonts.add(face);
    customFonts.value.push(family);
    store.fontFamily = `${family}, sans-serif`;
    store.generate();
  } catch (error) {
    fontError.value = error instanceof Error ? error.message : 'Font failed to load';
  }
}

onMounted(() => {
  if (!store.glyphs.length) store.generate();
});
</script>

<template>
  <div class="tool-page">
    <div class="tool-toolbar">
      <span class="tool-title">字 Font Extractor</span>
      <label class="inline-field">
        Text
        <input
          v-model="store.text"
          type="text"
          aria-label="Font text"
          placeholder="输入文字…"
          style="width: 200px"
        />
      </label>
      <label class="inline-field">
        Font
        <select v-model="store.fontFamily" style="max-width: 190px">
          <option v-for="font in BUILTIN_FONTS" :key="font.value" :value="font.value">{{ font.label }}</option>
          <option v-for="family in customFonts" :key="family" :value="`${family}, sans-serif`">{{ family }}</option>
        </select>
      </label>
      <label class="inline-field">
        Size
        <select v-model.number="store.fontSize">
          <option :value="16">16 px</option>
          <option :value="24">24 px</option>
          <option :value="32">32 px</option>
          <option :value="48">48 px</option>
          <option :value="64">64 px</option>
          <option :value="96">96 px</option>
        </select>
      </label>
      <div class="btn-group">
        <button class="btn sm icon" :class="{ toggled: store.bold }" title="Bold" @click="store.bold = !store.bold"><b>B</b></button>
        <button class="btn sm icon" :class="{ toggled: store.italic }" title="Italic" @click="store.italic = !store.italic"><i>I</i></button>
      </div>
      <button class="btn" @click="pickFont">↥ Upload TTF/OTF</button>
      <span class="toolbar-spacer"></span>
      <button class="btn primary" @click="store.generate()">⟳ Regenerate</button>
    </div>

    <div class="tool-main">
      <div v-if="fontError" class="alert-error">{{ fontError }}</div>

      <Panel :title="`Glyph Preview (${store.targetWidth}×${store.targetHeight})`">
        <div class="canvas-frame">
          <BitmapCanvas
            v-if="store.selectedGlyph"
            :bitmap="store.selectedGlyph.bitmap"
            :width="store.targetWidth"
            :height="store.targetHeight"
            :scale="previewScale"
            grid
          />
          <div v-else class="empty-state">
            <span class="big">字</span>
            <span>Type some text to render glyphs</span>
          </div>
        </div>
        <div v-if="store.glyphs.length > 1" class="glyph-strip">
          <button
            v-for="(glyph, index) in store.glyphs"
            :key="`${glyph.char}-${index}`"
            class="glyph-chip"
            :class="{ active: index === store.selectedGlyphIndex }"
            @click="store.selectedGlyphIndex = index"
          >{{ glyph.char }}</button>
        </div>
      </Panel>
    </div>

    <aside class="tool-side">
      <Panel title="Glyph Size">
        <div class="field-row">
          <label class="field"><span>Width</span><input v-model.number="store.targetWidth" type="number" min="8" max="128" /></label>
          <label class="field"><span>Height</span><input v-model.number="store.targetHeight" type="number" min="8" max="128" /></label>
        </div>
      </Panel>

      <Panel title="Rendering">
        <div class="field-stack">
          <div class="slider-field">
            <header><span>Threshold</span><b>{{ store.threshold }}</b></header>
            <input v-model.number="store.threshold" type="range" min="0" max="255" />
          </div>
          <label class="check"><input v-model="store.invert" type="checkbox" /> Invert (0 = pixel on)</label>
        </div>
      </Panel>

      <Panel title="Encoding">
        <EncodingFields :store="store" />
      </Panel>

      <Panel title="Stats">
        <div class="stat-list">
          <div class="stat-row"><span>Characters</span><b>{{ store.glyphs.length }}</b></div>
          <div class="stat-row"><span>Bits / glyph</span><b>{{ store.targetWidth * store.targetHeight }}</b></div>
          <div class="stat-row"><span>Identifier</span><b class="mono">{{ store.outputName }}</b></div>
        </div>
      </Panel>
    </aside>

    <div class="tool-output">
      <CodeOutput
        :source="store.generatedSource"
        :name="store.outputName"
        :width="store.targetWidth"
        :height="store.targetHeight"
        v-bind="exportPayload"
        :extra="{ text: store.text }"
      />
    </div>

    <input ref="fontInput" type="file" class="hidden-input" accept=".ttf,.otf,.woff,.woff2" @change="onFontFile" />
  </div>
</template>
