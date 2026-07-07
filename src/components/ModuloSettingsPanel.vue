<template>
  <div class="config-panel">
    <h3>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
      取模配置
    </h3>

    <PresetSelector
      :model-value="presetId"
      :presets="presetOptions"
      @update:model-value="$emit('update:presetId', $event)"
      @select="$emit('applyPreset', $event)"
    />

    <div class="config-item">
      <label>点阵大小</label>
      <div class="size-inputs">
        <input type="number" :value="width" min="1" max="512" placeholder="宽" @input="$emit('update:width', Number($event.target.value))">
        <span>×</span>
        <input type="number" :value="height" min="1" max="512" placeholder="高" @input="$emit('update:height', Number($event.target.value))">
      </div>
    </div>

    <div class="config-item">
      <label>颜色格式</label>
      <select :value="colorFormat" @change="$emit('update:colorFormat', $event.target.value)">
        <option value="MONO1">MONO1 单色位图</option>
        <option value="GRAY2">GRAY2 2级灰度</option>
        <option value="GRAY4">GRAY4 16级灰度</option>
        <option value="GRAY8">GRAY8 256级灰度</option>
        <option value="RGB332">RGB332</option>
        <option value="RGB565">RGB565</option>
        <option value="BGR565">BGR565</option>
        <option value="RGB888">RGB888</option>
        <option value="BGR888">BGR888</option>
        <option value="ARGB8888">ARGB8888</option>
        <option value="RGBA8888">RGBA8888</option>
      </select>
    </div>

    <div class="config-item">
      <label>输出格式</label>
      <select :value="outputFormat" @change="$emit('update:outputFormat', $event.target.value)">
        <option value="c-array">C数组</option>
        <option value="c-header">C头文件</option>
        <option value="lvgl">LVGL Descriptor</option>
        <option value="arduino">Arduino PROGMEM</option>
        <option value="hex">十六进制文本</option>
        <option value="binary">二进制文本</option>
        <option value="raw-bin">裸bin</option>
      </select>
    </div>

    <div class="config-item">
      <label>缩放方式</label>
      <select :value="resizeMode" @change="$emit('update:resizeMode', $event.target.value)">
        <option value="stretch">拉伸填充</option>
        <option value="contain">等比适应</option>
        <option value="cover">等比裁切</option>
        <option value="crop-center">居中裁剪</option>
        <option value="pad">留边填充</option>
      </select>
    </div>

    <slot name="font-settings" />

    <div class="config-item">
      <label>取模方式</label>
      <select :value="scanMode" @change="$emit('update:scanMode', $event.target.value)">
        <option value="row">逐行式（横向取模）</option>
        <option value="column">逐列式（纵向取模）</option>
      </select>
    </div>

    <div class="config-item">
      <label>编码方式</label>
      <select :value="encodingMode" @change="$emit('update:encodingMode', $event.target.value)">
        <option value="阴码">阴码（1点亮）</option>
        <option value="阳码">阳码（0点亮）</option>
      </select>
    </div>

    <div class="config-item">
      <label>字节顺序</label>
      <select :value="byteOrder" @change="$emit('update:byteOrder', $event.target.value)">
        <option value="msb">高位在前（MSB）</option>
        <option value="lsb">低位在前（LSB）</option>
      </select>
    </div>

    <div class="config-item">
      <label>旋转</label>
      <select :value="rotation" @change="$emit('update:rotation', Number($event.target.value))">
        <option :value="0">0°</option>
        <option :value="90">90°</option>
        <option :value="180">180°</option>
        <option :value="270">270°</option>
      </select>
    </div>

    <div class="config-item">
      <label class="checkbox-label">
        <input type="checkbox" :checked="flipX" @change="$emit('update:flipX', $event.target.checked)">
        水平翻转
      </label>
      <label class="checkbox-label">
        <input type="checkbox" :checked="flipY" @change="$emit('update:flipY', $event.target.checked)">
        垂直翻转
      </label>
    </div>
  </div>
</template>

<script setup>
import PresetSelector from './PresetSelector.vue'

defineProps({
  presetOptions: { type: Array, required: true },
  presetId: { type: String, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  colorFormat: { type: String, required: true },
  outputFormat: { type: String, required: true },
  resizeMode: { type: String, required: true },
  scanMode: { type: String, required: true },
  encodingMode: { type: String, required: true },
  byteOrder: { type: String, required: true },
  rotation: { type: Number, required: true },
  flipX: { type: Boolean, required: true },
  flipY: { type: Boolean, required: true },
})

defineEmits([
  'update:presetId',
  'update:width',
  'update:height',
  'update:colorFormat',
  'update:outputFormat',
  'update:resizeMode',
  'update:scanMode',
  'update:encodingMode',
  'update:byteOrder',
  'update:rotation',
  'update:flipX',
  'update:flipY',
  'applyPreset',
])
</script>

