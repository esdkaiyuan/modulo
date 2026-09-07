<script setup lang="ts">
import { computed, ref } from 'vue';
import { t } from '../../../i18n';
import type { MaterialItem } from '../types';

const props = defineProps<{
  materials: MaterialItem[];
  totalBeads: number;
}>();

const sortBy = ref<'count' | 'code' | 'name'>('count');

const sortedMaterials = computed(() => {
  const items = [...props.materials];
  if (sortBy.value === 'code') {
    items.sort((a, b) => a.bead.code.localeCompare(b.bead.code, undefined, { numeric: true }));
  } else if (sortBy.value === 'name') {
    items.sort((a, b) => a.bead.name.localeCompare(b.bead.name));
  }
  return items;
});

function copyAllCodes() {
  const lines = props.materials.map((m) =>
    m.symbol + '\t' + m.bead.code + '\t' + m.bead.name + '\t' + m.count + '\t' + m.percentage.toFixed(1) + '%'
  );
  const text = '符号\t色号\t名称\t数量\t占比\n' + lines.join('\n');
  navigator.clipboard?.writeText(text).catch(() => {});
}
</script>

<template>
  <div class="bead-left-sidebar">
    <div class="bead-sidebar-section bead-sidebar-grow">
      <div class="bead-sidebar-head">
        <span class="bead-sidebar-title">{{ t('bead.materials') }}</span>
        <button class="btn sm" @click="copyAllCodes" :disabled="materials.length === 0" title="复制物料清单">📋</button>
      </div>
      <div class="bead-sidebar-body">
        <div class="bead-stat-row"><span>{{ t('bead.totalBeads') }}</span><b>{{ totalBeads.toLocaleString() }}</b></div>
        <div class="bead-stat-row"><span>{{ t('bead.colorCount') }}</span><b>{{ materials.length }}</b></div>

        <div class="bead-mat-sort" v-if="materials.length > 0">
          <span class="bead-mat-sort-label">排序</span>
          <button class="btn xs" :class="{ toggled: sortBy === 'count' }" @click="sortBy = 'count'">数量</button>
          <button class="btn xs" :class="{ toggled: sortBy === 'code' }" @click="sortBy = 'code'">色号</button>
          <button class="btn xs" :class="{ toggled: sortBy === 'name' }" @click="sortBy = 'name'">名称</button>
        </div>

        <div v-if="materials.length > 0" class="bead-material-list">
          <div v-for="item in sortedMaterials" :key="item.bead.code" class="bead-material-item" :title="item.bead.code + ' ' + item.bead.name">
            <span class="bead-swatch" :style="{ background: item.bead.hex }"></span>
            <span class="bead-mat-symbol" :title="'符号: ' + item.symbol">{{ item.symbol }}</span>
            <span class="bead-mat-info">
              <span class="bead-mat-code">{{ item.bead.code }}</span>
              <span class="bead-mat-name">{{ item.bead.name }}</span>
            </span>
            <span class="bead-mat-count" :title="item.count + ' 颗 (' + item.percentage.toFixed(1) + '%)'">
              {{ item.count }}
            </span>
            <div class="bead-mat-bar"><div class="bead-mat-bar-fill" :style="{ width: item.percentage + '%' }"></div></div>
          </div>
        </div>
        <div v-else class="empty-hint">{{ t('bead.noMaterials') }}</div>
      </div>
    </div>
  </div>
</template>
