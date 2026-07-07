const toWords = (bytes) => {
  const words = []
  for (let index = 0; index < bytes.length; index += 2) {
    words.push(((bytes[index] || 0) << 8) | (bytes[index + 1] || 0))
  }
  return words
}

export const formatArduinoProgmem = (result, options = {}) => {
  const name = options.name || result.name || 'bitmap_img'
  const words = toWords(result.data)
    .map(word => `0x${word.toString(16).toUpperCase().padStart(4, '0')}`)
    .join(', ')

  return `#include <Arduino.h>
#include <avr/pgmspace.h>

#define ${name.toUpperCase()}_WIDTH ${result.width}
#define ${name.toUpperCase()}_HEIGHT ${result.height}

const uint16_t ${name}[] PROGMEM = {
    ${words}
};`
}

