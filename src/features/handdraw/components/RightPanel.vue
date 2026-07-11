<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import { usePixelStore } from '../../../stores/pixelStore';
import HanddrawPixelSample from './HanddrawPixelSample.vue';

const store = usePixelStore();
const preview = ref<HTMLCanvasElement | null>(null);

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
        <button class="plus">+</button>
      </div>
      <div class="color-field">
        <div class="picker-dot"></div>
        <div class="hue-strip"></div>
      </div>
    </section>

    <section class="panel-card preview-card handdraw-preview-card">
      <h2>PREVIEW</h2>
      <div class="preview-box handdraw-adaptive-window adaptive-material-window">
        <canvas ref="preview" width="224" height="224"></canvas>
        <HanddrawPixelSample variant="preview" :frame="1" />
      </div>
      <div class="preview-footer">
        <span>{{ store.width }} x {{ store.height }}</span>
        <span>□ ↗</span>
      </div>
    </section>

    <section class="panel-card handdraw-encoder-card">
      <h2>ENCODING</h2>
      <div class="field-label" data-test="handdraw-mode"><strong>Modulo Mode</strong><div class="segmented-control"><button type="button" :class="{ active: store.mode === 'mono' }" @click="store.mode = 'mono'">Mono</button><button type="button" :class="{ active: store.mode !== 'mono' }" @click="store.mode = 'rgb565'">Color</button></div></div>
      <label v-if="store.mode !== 'mono'" class="field-label">Color Encoding<select v-model="store.mode" data-test="handdraw-color-encoding"><option value="rgb565">RGB565</option><option value="rgb888">RGB888</option><option value="palette16">16-color Palette</option></select></label>
      <label class="field-label">Scan
        <select v-model="store.scanDirection" data-test="handdraw-scan">
          <option value="horizontal-ltr">Left → Right, Top → Bottom</option>
          <option value="horizontal-rtl">Right → Left, Top → Bottom</option>
          <option value="vertical-ttb">Top → Bottom, Left → Right</option>
          <option value="vertical-btt">Bottom → Top, Left → Right</option>
        </select>
      </label>
      <label v-if="store.mode === 'mono'" class="field-label">Bit Order
        <select v-model="store.bitOrder">
          <option value="msb">MSB First</option>
          <option value="lsb">LSB First</option>
        </select>
      </label>
      <label v-if="store.mode === 'mono'" class="field-label">Polarity
        <select v-model="store.polarity">
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
        </select>
      </label>
      <label v-if="store.mode === 'rgb565'" class="field-label">Byte Order<select v-model="store.rgb565ByteOrder"><option value="msb-first">High Byte First</option><option value="lsb-first">Low Byte First</option></select></label>
      <label v-if="store.mode === 'rgb888'" class="field-label">Channel Order<select v-model="store.rgb888Order"><option value="rgb">RGB</option><option value="bgr">BGR</option></select></label>
      <label v-if="store.mode !== 'mono'" class="field-label">Transparent Pixel Color<input v-model="store.transparentBackground" type="color" /></label>
    </section>

    <section class="panel-card layers-card handdraw-layers-card">
      <h2>LAYERS <span>＋ ⧉</span></h2>
      <div class="layer active"><span>◉</span><span class="thumb"><HanddrawPixelSample variant="layer" compact /></span><strong>Layer 1</strong></div>
      <div class="layer"><span>⊙</span><span class="thumb blank"><HanddrawPixelSample variant="blank" compact /></span><strong>Background</strong><small>▣</small></div>
    </section>

    <section class="status-card">
      <span>X: {{ store.cursorX }}, Y: {{ store.cursorY }}</span>
      <span class="status-color" :style="{ backgroundColor: store.activeColor }"></span>
      <span>{{ store.activeColor }}</span>
    </section>
  </aside>
</template>
