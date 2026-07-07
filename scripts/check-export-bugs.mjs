import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const source = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')

const script = source.match(/<script setup>([\s\S]*?)<\/script>/)?.[1] ?? ''

const declaredFunctions = new Set(
  [...script.matchAll(/const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(/g)].map(match => match[1])
)

for (const match of script.matchAll(/\b(format[A-Za-z]+Data)\s*\(/g)) {
  const functionName = match[1]
  assert(
    declaredFunctions.has(functionName),
    `${functionName} is called but is not declared`
  )
}

for (const exportName of ['exportCFile', 'exportBatchCFile', 'exportDrawCFile']) {
  const exportBody = script.match(
    new RegExp(`const\\s+${exportName}\\s*=\\s*\\(\\)\\s*=>\\s*{([\\s\\S]*?)\\n}`)
  )?.[1] ?? ''

  assert(exportBody.includes('document.body.appendChild(a)'), `${exportName} must append its link before clicking`)
  assert(exportBody.includes('document.body.removeChild(a)'), `${exportName} must remove its link after clicking`)
  assert(exportBody.includes('URL.revokeObjectURL(url)'), `${exportName} must revoke its object URL`)
}

const style = source.match(/<style scoped>([\s\S]*?)<\/style>/)?.[1] ?? ''

assert.match(style, /@media\s*\(max-width:\s*768px\)/, 'mobile styles must include a phone breakpoint')
assert.match(style, /\.main-content\s*{[\s\S]*?flex-direction:\s*column/, 'mobile layout must stack sidebar and content')
assert.match(style, /\.nav-menu\s*{[\s\S]*?overflow-x:\s*auto/, 'mobile nav must scroll horizontally')
assert.match(style, /\.image-result\s*,\s*\.media-result-layout\s*{[\s\S]*?grid-template-columns:\s*1fr/, 'mobile previews must use one column')
assert.match(style, /\.result-actions\s*{[\s\S]*?flex-wrap:\s*wrap/, 'mobile result buttons must wrap')
