<script setup lang="ts">
import { usePixelStore, type Tool } from '../../../stores/pixelStore';

const store = usePixelStore();

const tools: Array<{ id: Tool | 'undo' | 'redo'; label: string; key: string; icon: string }> = [
  { id: 'pencil', label: 'Pencil', key: 'P', icon: '✎' },
  { id: 'eraser', label: 'Eraser', key: 'E', icon: '▱' },
  { id: 'fill', label: 'Fill', key: 'F', icon: '◒' },
  { id: 'eyedropper', label: 'Eyedropper', key: 'I', icon: '⌁' },
  { id: 'undo', label: 'Undo', key: 'Ctrl+Z', icon: '↶' },
  { id: 'redo', label: 'Redo', key: 'Ctrl+Y', icon: '↷' }
];

function handleTool(id: Tool | 'undo' | 'redo') {
  if (id === 'undo') store.undo();
  else if (id === 'redo') store.redo();
  else store.setTool(id);
}
</script>

<template>
  <aside class="left-panel handdraw-tool-stack">
    <section class="panel-card tools-card">
      <h2>TOOLS</h2>
      <button
        v-for="tool in tools"
        :key="tool.id"
        class="tool-row"
        :class="{ active: store.activeTool === tool.id }"
        @click="handleTool(tool.id)"
      >
        <span class="tool-icon">{{ tool.icon }}</span>
        <span>{{ tool.label }}</span>
        <small>{{ tool.key }}</small>
      </button>
    </section>

    <section class="panel-card">
      <h2>BRUSH</h2>
      <div class="brush-row">
        <button
          v-for="size in [1, 2, 3, 4, 5]"
          :key="size"
          class="brush-button"
          :class="{ selected: store.brushSize === size }"
          @click="store.brushSize = size"
        >
          <span :style="{ width: `${size * 5}px`, height: `${size * 5}px` }"></span>
        </button>
      </div>
    </section>

    <section class="panel-card">
      <h2>OPTIONS</h2>
      <label class="check-row"><input v-model="store.showGrid" type="checkbox" /> Grid</label>
      <label class="check-row"><input v-model="store.pixelPerfect" type="checkbox" /> Pixel Perfect</label>
      <label class="check-row"><input v-model="store.symmetry" type="checkbox" /> Symmetry <kbd>X</kbd></label>
    </section>
  </aside>
</template>
