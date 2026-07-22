<script setup lang="ts">
import { t } from '../../../i18n';
import type { MaterialItem } from '../types';

defineProps<{
  materials: MaterialItem[];
  totalBeads: number;
}>();
</script>

<template>
  <div class="bead-left-sidebar">
    <div class="bead-sidebar-section bead-sidebar-grow">
      <div class="bead-sidebar-head">
        <span class="bead-sidebar-title">{{ t('bead.materials') }}</span>
      </div>
      <div class="bead-sidebar-body">
        <div class="bead-stat-row"><span>{{ t('bead.totalBeads') }}</span><b>{{ totalBeads.toLocaleString() }}</b></div>
        <div class="bead-stat-row"><span>{{ t('bead.colorCount') }}</span><b>{{ materials.length }}</b></div>
        <div v-if="materials.length > 0" class="bead-material-list">
          <div v-for="item in materials" :key="item.bead.code" class="bead-material-item">
            <span class="bead-swatch" :style="{ background: item.bead.hex }"></span>
            <span class="bead-mat-symbol">{{ item.symbol }}</span>
            <span class="bead-mat-info">
              <span class="bead-mat-code">{{ item.bead.code }}</span>
              <span class="bead-mat-name">{{ item.bead.name }}</span>
            </span>
            <span class="bead-mat-count">{{ item.count }}</span>
            <div class="bead-mat-bar"><div class="bead-mat-bar-fill" :style="{ width: item.percentage + '%' }"></div></div>
          </div>
        </div>
        <div v-else class="empty-hint">{{ t('bead.noMaterials') }}</div>
      </div>
    </div>
  </div>
</template>
