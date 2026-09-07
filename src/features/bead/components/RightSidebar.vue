<script setup lang="ts">
import { ref, watch } from 'vue';
import Panel from '../../../components/Panel.vue';
import { useBeadPatternStore } from '../stores/beadPatternStore';
import { BEAD_BRANDS } from '../paletteData';
import { t } from '../../../i18n';

const store = useBeadPatternStore();
const customBoardSize = ref(29);
const isCustomBoard = ref(false);

function onBoardSizeChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value;
  if (val === 'custom') {
    isCustomBoard.value = true;
    store.setBoardSize(customBoardSize.value);
  } else {
    isCustomBoard.value = false;
    store.setBoardSize(Number(val));
  }
}

function onCustomSizeInput(e: Event) {
  const val = Math.max(1, Math.min(200, Number((e.target as HTMLInputElement).value) || 1));
  customBoardSize.value = val;
  store.setBoardSize(val);
}
</script>

<template>
  <div class="bead-right-sidebar">
    <Panel :title="t('bead.brand')">
      <div class="field-stack">
        <label class="field">
          <select :value="store.brandId" @change="store.setBrand(($event.target as HTMLSelectElement).value as any)">
            <option v-for="b in BEAD_BRANDS" :key="b.id" :value="b.id">{{ b.name }} ({{ b.colors.length }})</option>
          </select>
        </label>
      </div>
    </Panel>

    <Panel :title="t('bead.gridSize')">
      <div class="field-stack">
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
      </div>
    </Panel>

    <Panel :title="t('bead.boardSize')">
      <div class="field-stack">
        <label class="field">
          <select :value="isCustomBoard ? 'custom' : store.boardSize" @change="onBoardSizeChange">
            <option :value="29">29×29 {{ t('bead.standard') }}</option>
            <option :value="57">57×57 {{ t('bead.large') }}</option>
            <option :value="58">58×58 {{ t('bead.artkal') }}</option>
            <option value="custom">{{ t('bead.customSize') }}</option>
          </select>
        </label>
        <div v-if="isCustomBoard" class="field-row">
          <label class="field">
            <span>{{ t('bead.boardWidth') }}</span>
            <input :value="customBoardSize" type="number" min="1" max="200" @change="onCustomSizeInput" />
          </label>
          <label class="field">
            <span>{{ t('bead.boardHeight') }}</span>
            <input :value="customBoardSize" type="number" min="1" max="200" @change="onCustomSizeInput" />
          </label>
        </div>
        <p v-if="isCustomBoard" class="hint">{{ t('bead.customSizeHint', { n: customBoardSize }) }}</p>
      </div>
    </Panel>

    <Panel :title="t('bead.viewMode')">
      <div class="field-stack">
        <div class="bead-view-btns">
          <button class="btn sm" :class="{ toggled: store.viewMode === 'colors' }" @click="store.setViewMode('colors')">{{ t('bead.viewColors') }}</button>
          <button class="btn sm" :class="{ toggled: store.viewMode === 'symbols' }" @click="store.setViewMode('symbols')">{{ t('bead.viewSymbols') }}</button>
          <button class="btn sm" :class="{ toggled: store.viewMode === 'both' }" @click="store.setViewMode('both')">{{ t('bead.viewBoth') }}</button>
        </div>
      </div>
    </Panel>

    <Panel :title="t('bead.titleField')">
      <div class="field-stack">
        <label class="field">
          <input v-model="store.patternTitle" type="text" :placeholder="t('bead.titlePlaceholder')" style="width:100%" />
        </label>
      </div>
    </Panel>
  </div>
</template>
