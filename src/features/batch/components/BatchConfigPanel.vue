<script setup lang="ts">
import PanelSection from '../../../components/common/PanelSection.vue';

const fields = ['Scanning Direction', 'Encoding Mode', 'Byte Order', 'Output Format', 'Target Width', 'Target Height', 'Threshold Value'];
</script>

<template>
  <aside class="batch-side">
    <PanelSection step="3" title="Configuration">
      <label class="field-label">Parameter Preset <select><option>Preset 1</option></select></label>
      <div class="segmented"><button>Preset 1</button><button>Preset 2</button><button>Custom</button><button>▣</button></div>
      <h3>Extraction Parameters <small>(Applied to All Files)</small></h3>
      <label v-for="field in fields" :key="field" class="field-label">
        {{ field }}
        <select v-if="!field.includes('Width') && !field.includes('Height') && !field.includes('Threshold')">
          <option>{{ field === 'Output Format' ? 'C Array (uint8_t[])' : 'Left to Right, Top to Bottom' }}</option>
        </select>
        <input v-else :value="field.includes('Height') ? 64 : 128" />
      </label>
      <button class="primary-btn wide">⇊ Apply to All</button>
    </PanelSection>
    <PanelSection title="Summary Statistics">
      <div class="stats-row">
        <div><span>Total Files</span><strong>47</strong></div>
        <div><span>Completed</span><strong>23</strong></div>
        <div><span>Failed</span><strong>2</strong></div>
        <div><span>Pending</span><strong>22</strong></div>
      </div>
    </PanelSection>
  </aside>
</template>
