import { existsSync, readFileSync } from 'node:fs'

const componentPaths = [
  '../src/components/SectionCard.vue',
  '../src/components/UploadDropzone.vue',
  '../src/components/ResultToolbar.vue',
  '../src/components/StatusSummary.vue',
]

const failures = []

for (const componentPath of componentPaths) {
  if (!existsSync(new URL(componentPath, import.meta.url))) {
    failures.push(`Missing component: ${componentPath}`)
  }
}

const appSource = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
const requiredAppMarkers = [
  "import SectionCard from './components/SectionCard.vue'",
  "import UploadDropzone from './components/UploadDropzone.vue'",
  "import ResultToolbar from './components/ResultToolbar.vue'",
  "import StatusSummary from './components/StatusSummary.vue'",
  '<StatusSummary',
  '<SectionCard',
  '<UploadDropzone',
  '<ResultToolbar',
  '.section-card',
  '.upload-dropzone',
  '.result-toolbar',
  '.status-summary',
]

for (const marker of requiredAppMarkers) {
  if (!appSource.includes(marker)) {
    failures.push(`App.vue is missing marker: ${marker}`)
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('Overall UI polish structure checks passed.')
