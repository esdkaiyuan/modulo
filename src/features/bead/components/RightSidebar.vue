<script setup lang="ts">
import { computed, ref } from 'vue';
import Panel from '../../../components/Panel.vue';
import { useBeadPatternStore } from '../stores/beadPatternStore';
import { BEAD_BRANDS } from '../paletteData';
import { t } from '../../../i18n';

defineProps<{ activeTab?: 'image' | 'draw' | 'canvas' }>();

const store = useBeadPatternStore();
const customBoardSize = ref(29);
const isCustomBoard = ref(false);

const excludeRows = computed(() => {
  const codes = new Set<string>(store.excludeColors);
  for (const m of store.materials) codes.add(m.bead.code);
  const rows: { code: string; name: string; hex: string; excluded: boolean }[] = [];
  for (const code of codes) {
    const bead = store.brand.colors.find((c) => c.code === code);
    if (bead) rows.push({ code: bead.code, name: bead.name, hex: bead.hex, excluded: store.excludeColors.has(bead.code) });
  }
  return rows;
});

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
            <option v-for="b in BEAD_BRANDS" :key="b.id" :value="b.id">{{ t(b.nameKey) }} ({{ b.colors.length }})</option>
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
          <label class="checkbox-field">
            <input
              type="checkbox"
              :checked="store.lockAspectRatio"
              :disabled="store.sourceWidth === 0"
              @change="store.setLockAspectRatio(($event.target as HTMLInputElement).checked)"
            />
            <span>{{ t('bead.lockRatio') }}</span>
          </label>
          <p class="hint">{{ store.lockAspectRatio ? t('bead.lockRatioHint') : t('bead.freeHint') }}</p>
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
            <option :value="29">{{ t('bead.board29') }}</option>
            <option :value="57">{{ t('bead.board57') }}</option>
            <option :value="58">{{ t('bead.board58') }}</option>
            <option value="custom">{{ t('bead.boardCustom') }}</option>
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

    <Panel :title="t('bead.displayOptions')">
      <div class="field-stack">
        <label class="checkbox-field">
          <input type="checkbox" :checked="store.showGrid" @change="store.setShowGrid(($event.target as HTMLInputElement).checked)" />
          <span>{{ t('bead.optGrid') }}</span>
        </label>
        <label class="checkbox-field">
          <input type="checkbox" :checked="store.showBoardLines" @change="store.setShowBoardLines(($event.target as HTMLInputElement).checked)" />
          <span>{{ t('bead.optBoardLines') }}</span>
        </label>
        <label class="checkbox-field">
          <input type="checkbox" :checked="store.showCenterCrosshair" @change="store.setShowCenterCrosshair(($event.target as HTMLInputElement).checked)" />
          <span>{{ t('bead.optCrosshair') }}</span>
        </label>
        <p class="hint">{{ t('bead.optHint') }}</p>
      </div>
    </Panel>

    <Panel :title="t('bead.bgRemove')">
      <div class="field-stack">
        <label class="field">
          <select :value="store.bgRemoveMode" @change="store.setBgRemoveMode(($event.target as HTMLSelectElement).value as any)" :disabled="store.isRemovingBg">
            <option value="none">{{ t('bead.bgNone') }}</option>
            <option value="ai">{{ t('bead.bgAi') }}</option>
            <option value="corner">{{ t('bead.bgCorner') }}</option>
            <option value="auto">{{ t('bead.bgAuto') }}</option>
            <option value="tolerance">{{ t('bead.bgWhite') }}</option>
          </select>
        </label>
        <div v-if="store.isRemovingBg" class="bg-removing-indicator">
          <div class="bg-progress-bar">
            <div class="bg-progress-fill" :style="{ width: Math.round(store.bgRemoveProgress * 100) + '%' }"></div>
          </div>
          <p class="hint">{{ t('bead.bgAiProgress', { p: Math.round(store.bgRemoveProgress * 100) }) }}</p>
        </div>
        <template v-else-if="store.bgRemoveMode !== 'none' && store.bgRemoveMode !== 'ai'">
          <label class="field">
            <span>{{ t('bead.bgToleranceLabel', { n: store.bgTolerance }) }}</span>
            <input type="range" min="0" max="150" :value="store.bgTolerance"
              @input="store.setBgTolerance(Number(($event.target as HTMLInputElement).value))" />
          </label>
          <p class="hint" v-if="store.bgRemoveMode === 'auto'">{{ t('bead.bgAutoHint') }}</p>
          <p class="hint" v-if="store.bgRemoveMode === 'tolerance'">{{ t('bead.bgWhiteHint') }}</p>
          <p class="hint" v-if="store.bgRemoveMode === 'corner'">{{ t('bead.bgCornerHint') }}</p>
        </template>
        <p class="hint" v-if="store.bgRemoveMode === 'ai' && !store.isRemovingBg">{{ t('bead.bgAiHint') }}</p>
      </div>
    </Panel>

    <Panel v-if="activeTab === 'image'" :title="t('bead.excludeColors')">
      <div class="field-stack">
        <div v-if="excludeRows.length > 0" class="bead-exclude-list">
          <button
            v-for="row in excludeRows"
            :key="row.code"
            type="button"
            class="bead-exclude-item"
            :class="{ excluded: row.excluded }"
            :title="row.excluded ? t('bead.excludeClear') : t('bead.excludeColors')"
            @click="store.toggleExcludeColor(row.code)"
          >
            <span class="bead-swatch" :style="{ background: row.hex }"></span>
            <span class="bead-exclude-code">{{ row.code }}</span>
            <span class="bead-exclude-name">{{ row.name }}</span>
            <span class="bead-exclude-mark">{{ row.excluded ? '✕' : '' }}</span>
          </button>
        </div>
        <p v-else class="hint">{{ t('bead.noMaterials') }}</p>
        <p class="hint">{{ t('bead.excludeHint') }}</p>
        <button v-if="store.excludeColors.size > 0" class="btn sm" @click="store.clearExcludeColors()">
          {{ t('bead.excludeClear') }} ({{ store.excludeColors.size }})
        </button>
      </div>
    </Panel>

    <Panel :title="t('bead.viewMode')">
      <div class="field-stack">
        <div class="bead-view-btns">
          <button class="btn sm" :class="{ toggled: store.viewMode === 'colors' }" @click="store.setViewMode('colors')">{{ t('bead.viewColors') }}</button>
          <button class="btn sm" :class="{ toggled: store.viewMode === 'symbols' }" @click="store.setViewMode('symbols')">{{ t('bead.viewSymbols') }}</button>
          <button class="btn sm" :class="{ toggled: store.viewMode === 'both' }" @click="store.setViewMode('both')">{{ t('bead.viewBoth') }}</button>
        </div>
        <label class="checkbox-field">
          <input type="checkbox" :checked="store.showColorCodes" @change="store.setShowColorCodes(($event.target as HTMLInputElement).checked)" />
          <span>{{ t('bead.colorLabels') }}</span>
        </label>
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
