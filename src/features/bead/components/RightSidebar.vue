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
            <option :value="29">29×29 标准板 (MARD/Perler)</option>
            <option :value="57">57×57 大板 (Hama Mini)</option>
            <option :value="58">58×58 大板 (Artkal)</option>
            <option value="custom">自定义尺寸</option>
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

    <Panel title="显示选项">
      <div class="field-stack">
        <label class="checkbox-field">
          <input type="checkbox" :checked="store.showGrid" @change="store.setShowGrid(($event.target as HTMLInputElement).checked)" />
          <span>网格线（5格加粗）</span>
        </label>
        <label class="checkbox-field">
          <input type="checkbox" :checked="store.showBoardLines" @change="store.setShowBoardLines(($event.target as HTMLInputElement).checked)" />
          <span>板边界线</span>
        </label>
        <label class="checkbox-field">
          <input type="checkbox" :checked="store.showCenterCrosshair" @change="store.setShowCenterCrosshair(($event.target as HTMLInputElement).checked)" />
          <span>中心定位十字线</span>
        </label>
        <p class="hint">按照真实拼豆底板样式：5格分线 + 板边界 + 中心定位</p>
      </div>
    </Panel>

    <Panel title="背景去除">
      <div class="field-stack">
        <label class="field">
          <select :value="store.bgRemoveMode" @change="store.setBgRemoveMode(($event.target as HTMLSelectElement).value as any)" :disabled="store.isRemovingBg">
            <option value="none">关闭</option>
            <option value="ai">AI 智能抠图（推荐）</option>
            <option value="corner">边缘填充</option>
            <option value="auto">自动识别背景色</option>
            <option value="tolerance">白色背景（容差）</option>
          </select>
        </label>
        <div v-if="store.isRemovingBg" class="bg-removing-indicator">
          <div class="bg-progress-bar">
            <div class="bg-progress-fill" :style="{ width: Math.round(store.bgRemoveProgress * 100) + '%' }"></div>
          </div>
          <p class="hint">AI 正在处理中... {{ Math.round(store.bgRemoveProgress * 100) }}%</p>
        </div>
        <template v-else-if="store.bgRemoveMode !== 'none' && store.bgRemoveMode !== 'ai'">
          <label class="field">
            <span>容差: {{ store.bgTolerance }}</span>
            <input type="range" min="0" max="150" :value="store.bgTolerance"
              @input="store.setBgTolerance(Number(($event.target as HTMLInputElement).value))" />
          </label>
          <p class="hint" v-if="store.bgRemoveMode === 'auto'">从图片边缘取样背景色，接近的区域变空</p>
          <p class="hint" v-if="store.bgRemoveMode === 'tolerance'">将白色及接近白色的区域设为空</p>
          <p class="hint" v-if="store.bgRemoveMode === 'corner'">从边缘填充式去除背景，适合主体居中的图片</p>
        </template>
        <p class="hint" v-if="store.bgRemoveMode === 'ai' && !store.isRemovingBg">基于 U2-Net 深度学习模型，高质量自动识别主体</p>
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
          <span>显示色号标注</span>
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
