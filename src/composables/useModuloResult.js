export const useModuloResult = () => {
  const outputFormatLabels = [
    { value: 'c-array', label: 'C数组' },
    { value: 'c-header', label: 'C头文件' },
    { value: 'lvgl', label: 'LVGL Descriptor' },
    { value: 'arduino', label: 'Arduino PROGMEM' },
    { value: 'hex', label: '十六进制文本' },
    { value: 'binary', label: '二进制文本' },
    { value: 'raw-bin', label: '裸bin' },
  ]

  return {
    outputFormatLabels,
  }
}

