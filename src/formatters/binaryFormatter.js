export const formatHexText = (data) => {
  return Array.from(data).map(byte => `0x${Number(byte).toString(16).toUpperCase().padStart(2, '0')}`).join(', ')
}

export const formatBinaryText = (data) => {
  return Array.from(data).map(byte => Number(byte).toString(2).padStart(8, '0')).join('\n')
}

export const formatRawBinary = (data) => new Uint8Array(Array.from(data))

