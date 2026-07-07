import { formatHexText } from './binaryFormatter.js'

const sanitizeName = (name = 'bitmap_data') => {
  return String(name).replace(/[^A-Za-z0-9_]/g, '_').replace(/^[^A-Za-z_]/, '_$&')
}

const guardName = (name) => `${sanitizeName(name).toUpperCase()}_H`

export const formatCArray = (result, options = {}) => {
  const name = sanitizeName(options.name || result.name || 'bitmap_data')
  const type = options.type || 'uint8_t'
  return `#include <stdint.h>

#define ${name.toUpperCase()}_WIDTH ${result.width}
#define ${name.toUpperCase()}_HEIGHT ${result.height}
#define ${name.toUpperCase()}_BYTES ${result.data.length}

const ${type} ${name}[] = {
    ${formatHexText(result.data)}
};`
}

export const formatCHeader = (result, options = {}) => {
  const name = sanitizeName(options.name || result.name || 'bitmap_data')
  const guard = guardName(name)
  return `#ifndef ${guard}
#define ${guard}

#include <stdint.h>

#define ${name.toUpperCase()}_WIDTH ${result.width}
#define ${name.toUpperCase()}_HEIGHT ${result.height}
#define ${name.toUpperCase()}_BYTES ${result.data.length}

extern const uint8_t ${name}[];

#endif`
}

