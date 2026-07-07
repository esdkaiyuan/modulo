import { readFileSync } from 'node:fs'

const appSource = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
const settingsSource = readFileSync(new URL('../src/components/ModuloSettingsPanel.vue', import.meta.url), 'utf8')
const presetSource = readFileSync(new URL('../src/components/PresetSelector.vue', import.meta.url), 'utf8')

const checks = [
  ['App.vue', appSource, [
    'sidebar-section',
    'nav-section-label',
    'workflow-nav',
    'media-nav-group',
    'width: 300px;',
    '.nav-item.active::before',
  ]],
  ['ModuloSettingsPanel.vue', settingsSource, [
    'settings-panel-title',
    'settings-group',
    'settings-group-title',
    '预设',
    '画布',
    '颜色/编码',
    '扫描/变换',
    '字体',
  ]],
  ['PresetSelector.vue', presetSource, [
    'preset-selector',
  ]],
]

const failures = []

for (const [file, source, markers] of checks) {
  for (const marker of markers) {
    if (!source.includes(marker)) {
      failures.push(`${file} is missing marker: ${marker}`)
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('Left sidebar UI structure checks passed.')
