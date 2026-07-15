<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import { usePixelStore } from '../../../stores/pixelStore';

const store = usePixelStore();
const preview = ref<HTMLCanvasElement | null>(null);
const addColorInput = ref<HTMLInputElement | null>(null);

function addPaletteColor() {
  addColorInput.value?.click();
}

function onAddColor(event: Event) {
  const input = event.target as HTMLInputElement;
  const color = input.value;
  if (color && !store.palette.includes(color)) {
    store.palette.push(color);
  }
  input.value = '';
}

function renderPreview() {
  const el = preview.value;
  if (!el) return;
  const ctx = el.getContext('2d');
  if (!ctx) return;
  const cell = Math.floor(el.width / store.width);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, el.width, el.height);

  store.pixels.forEach((color, index) => {
    if (!color) return;
    const x = index % store.width;
    const y = Math.floor(index / store.width);
    ctx.fillStyle = color;
    ctx.fillRect(x * cell, y * cell, cell, cell);
  });
}

onMounted(renderPreview);
watch(() => store.pixels, () => nextTick(renderPreview), { deep: true });
</script>

<template>
  <aside class="right-panel handdraw-side-stack">
    <section class="panel-card color-card handdraw-color-card">
      <h2>COLOR</h2>
      <div class="color-current">
        <input v-model="store.activeColor" type="color" />
        <span>{{ store.activeColor }}</span>
      </div>
      <div class="swatches">
        <button
          v-for="color in store.palette"
          :key="color"
          :style="{ backgroundColor: color }"
          :title="color"
          @click="store.activeColor = color"
        />
        <button class="plus" @click="addPaletteColor">+</button>
      </div>
      <input ref="addColorInput" type="color" class="hidden-color-input" @change="onAddColor" />
    </section>

    <section class="panel-card preview-card handdraw-preview-card">
      <h2>PREVIEW</h2>
      <div class="preview-box handdraw-adaptive-window adaptive-material-window">
        <canvas ref="preview" width="224" height="224"></canvas>
      </div>
      <div class="preview-footer">
        <span>{{ store.width }} x {{ store.height }}</span>
      </div>
    </section>

    <section class="panel-card handdraw-encoder-card">
      <h2>ENCODING</h2>
      <label class="field-label">Scan
        <select v-model="store.scanDirection" data-test="handdraw-scan">
          <option value="horizontal-ltr">Left → Right, Top → Bottom</option>
          <option value="horizontal-rtl">Right → Left, Top → Bottom</option>
          <option value="vertical-ttb">Top → Bottom, Left → Right</option>
          <option value="vertical-btt">Bottom → Top, Left → Right</option>
        </select>
      </label>
      <label class="field-label">Bit Order
        <select v-model="store.bitOrder">
          <option value="msb">MSB First</option>
          <option value="lsb">LSB First</option>
        </select>
      </label>
      <label class="field-label">Polarity
        <select v-model="store.polarity">
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
        </select>
      </label>
      <label class="field-label">Brush Size
        <select v-model.number="store.brushSize">
          <option :value="1">1 px</option>
          <option :value="2">2 px</option>
          <option :value="3">3 px</option>
          <option :value="4">4 px</option>
        </select>
      </label>
      <label class="inline-check"><input v-model="store.symmetry" type="checkbox" /> Mirror symmetry</label>
    </section>

    <section class="status-card">
      <span>X: {{ store.cursorX }}, Y: {{ store.cursorY }}</span>
      <span class="status-color" :style="{ backgroundColor: store.activeColor }"></span>
      <span>{{ store.activeColor }}</span>
    </section>
  </aside>
</template>
