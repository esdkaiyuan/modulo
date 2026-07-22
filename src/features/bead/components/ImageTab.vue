<script setup lang="ts">
import Panel from '../../../components/Panel.vue';
import { useBeadPatternStore } from '../stores/beadPatternStore';
import { BEAD_BRANDS } from '../paletteData';
import { t } from '../../../i18n';

const store = useBeadPatternStore();
</script>

<template>
  <div class="bead-tab-content">
    <div class="tool-main">
      <Panel :title="t('bead.imageSettings')">
        <div class="field-stack">
          <div v-if="!store.hasImage" class="empty-hint">{{ t('bead.uploadHint') }}</div>
          <template v-else>
            <label class="field">
              <span>{{ t('bead.brand') }}</span>
              <select :value="store.brandId" @change="store.setBrand(($event.target as HTMLSelectElement).value as any)">
                <option v-for="b in BEAD_BRANDS" :key="b.id" :value="b.id">{{ b.name }} ({{ b.colors.length }})</option>
              </select>
            </label>
            <div class="btn-group" role="tablist">
              <button type="button" class="btn sm" :class="{ toggled: store.sizeMode === 'custom' }" @click="store.setSizeMode('custom')">{{ t('size.custom') }}</button>
              <button type="button" class="btn sm" :class="{ toggled: store.sizeMode === 'aspect' }" @click="store.setSizeMode('aspect')">{{ t('size.aspect') }}</button>
            </div>
            <template v-if="store.sizeMode === 'custom'">
              <div class="field-row">
                <label class="field">
                  <span>{{ t('common.width') }}</span>
                  <input :value="store.gridWidth" type="number" min="1" max="200" @change="store.setGridWidth(Number(($event.target as HTMLInputElement).value))" />
                </label>
                <label class="field">
                  <span>{{ t('common.height') }}</span>
                  <input :value="store.gridHeight" type="number" min="1" max="200" @change="store.setGridHeight(Number(($event.target as HTMLInputElement).value))" />
                </label>
              </div>
              <p class="hint">{{ t('bead.freeHint') }}</p>
            </template>
            <template v-else>
              <label class="field">
                <span>{{ t('bead.longEdge') }}</span>
                <input v-model.number="store.aspectLongEdge" type="number" min="1" max="200" />
              </label>
              <p class="hint">{{ t('bead.aspectResult', { w: store.gridWidth, h: store.gridHeight }) }}</p>
            </template>
            <button class="btn sm" @click="store.applyOriginalRatio()">{{ t('bead.originalRatio') }}</button>
            <label class="field">
              <span>{{ t('bead.boardSize') }}</span>
              <select :value="store.boardSize" @change="store.setBoardSize(Number(($event.target as HTMLSelectElement).value))">
                <option :value="29">29×29 {{ t('bead.standard') }}</option>
                <option :value="57">57×57 {{ t('bead.large') }}</option>
                <option :value="58">58×58 {{ t('bead.artkal') }}</option>
              </select>
            </label>
            <div class="bead-view-btns">
              <button class="btn sm" :class="{ toggled: store.viewMode === 'colors' }" @click="store.setViewMode('colors')">{{ t('bead.viewColors') }}</button>
              <button class="btn sm" :class="{ toggled: store.viewMode === 'symbols' }" @click="store.setViewMode('symbols')">{{ t('bead.viewSymbols') }}</button>
              <button class="btn sm" :class="{ toggled: store.viewMode === 'both' }" @click="store.setViewMode('both')">{{ t('bead.viewBoth') }}</button>
            </div>
          </template>
        </div>
      </Panel>
    </div>

    <aside class="tool-side">
      <Panel :title="t('bead.materials')">
        <div class="field-stack">
          <div class="bead-stat-row"><span>{{ t('bead.totalBeads') }}</span><b>{{ store.totalBeads.toLocaleString() }}</b></div>
          <div class="bead-stat-row"><span>{{ t('bead.colorCount') }}</span><b>{{ store.materials.length }}</b></div>
          <div class="bead-stat-row"><span>{{ t('bead.boardCount') }}</span><b>{{ store.boardCount }}</b></div>
          <div v-if="store.materials.length > 0" class="bead-material-list">
            <div v-for="item in store.materials" :key="item.bead.code" class="bead-material-item">
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
      </Panel>

      <Panel :title="t('bead.titleField')">
        <div class="field-stack">
          <label class="field">
            <input v-model="store.patternTitle" type="text" :placeholder="t('bead.titlePlaceholder')" style="width:100%" />
          </label>
        </div>
      </Panel>
    </aside>
  </div>
</template>
