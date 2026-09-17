/** Pre-made emoji and symbol presets for the free canvas. */
import type { MessageKey } from '../../i18n/messages';

export interface PresetItem {
  id: string;
  char: string;
  /** i18n key for the preset name — the picker renders it via `t()`. */
  labelKey: MessageKey;
  category: 'emoji' | 'symbol' | 'shape';
}

export const PRESET_CATEGORIES = ['emoji', 'symbol', 'shape'] as const;

export const PRESETS: PresetItem[] = [
  // Emoji
  { id: 'smile', char: '😊', labelKey: 'bead.preset.smile', category: 'emoji' },
  { id: 'heart', char: '❤️', labelKey: 'bead.preset.heart', category: 'emoji' },
  { id: 'star', char: '⭐', labelKey: 'bead.preset.star', category: 'emoji' },
  { id: 'fire', char: '🔥', labelKey: 'bead.preset.fire', category: 'emoji' },
  { id: 'thumbsup', char: '👍', labelKey: 'bead.preset.thumbsup', category: 'emoji' },
  { id: 'clap', char: '👏', labelKey: 'bead.preset.clap', category: 'emoji' },
  { id: 'cry', char: '😢', labelKey: 'bead.preset.cry', category: 'emoji' },
  { id: 'laugh', char: '😂', labelKey: 'bead.preset.laugh', category: 'emoji' },
  { id: 'cool', char: '😎', labelKey: 'bead.preset.cool', category: 'emoji' },
  { id: 'wink', char: '😉', labelKey: 'bead.preset.wink', category: 'emoji' },
  { id: 'kiss', char: '😘', labelKey: 'bead.preset.kiss', category: 'emoji' },
  { id: 'angry', char: '😠', labelKey: 'bead.preset.angry', category: 'emoji' },
  { id: 'surprise', char: '😲', labelKey: 'bead.preset.surprise', category: 'emoji' },
  { id: 'thinking', char: '🤔', labelKey: 'bead.preset.thinking', category: 'emoji' },
  { id: 'love', char: '🥰', labelKey: 'bead.preset.love', category: 'emoji' },
  { id: 'sparkle', char: '✨', labelKey: 'bead.preset.sparkle', category: 'emoji' },
  { id: 'rainbow', char: '🌈', labelKey: 'bead.preset.rainbow', category: 'emoji' },
  { id: 'sun', char: '☀️', labelKey: 'bead.preset.sun', category: 'emoji' },
  { id: 'moon', char: '🌙', labelKey: 'bead.preset.moon', category: 'emoji' },
  { id: 'cloud', char: '☁️', labelKey: 'bead.preset.cloud', category: 'emoji' },
  { id: 'flower', char: '🌸', labelKey: 'bead.preset.flower', category: 'emoji' },
  { id: 'leaf', char: '🍃', labelKey: 'bead.preset.leaf', category: 'emoji' },
  { id: 'pizza', char: '🍕', labelKey: 'bead.preset.pizza', category: 'emoji' },
  { id: 'cake', char: '🎂', labelKey: 'bead.preset.cake', category: 'emoji' },
  { id: 'cat', char: '🐱', labelKey: 'bead.preset.cat', category: 'emoji' },
  { id: 'dog', char: '🐶', labelKey: 'bead.preset.dog', category: 'emoji' },
  { id: 'bunny', char: '🐰', labelKey: 'bead.preset.bunny', category: 'emoji' },
  { id: 'bear', char: '🐻', labelKey: 'bead.preset.bear', category: 'emoji' },
  { id: 'panda', char: '🐼', labelKey: 'bead.preset.panda', category: 'emoji' },
  { id: 'unicorn', char: '🦄', labelKey: 'bead.preset.unicorn', category: 'emoji' },

  // Symbols
  { id: 's-heart', char: '♥', labelKey: 'bead.preset.s-heart', category: 'symbol' },
  { id: 's-star', char: '★', labelKey: 'bead.preset.s-star', category: 'symbol' },
  { id: 's-diamond', char: '◆', labelKey: 'bead.preset.s-diamond', category: 'symbol' },
  { id: 's-circle', char: '●', labelKey: 'bead.preset.s-circle', category: 'symbol' },
  { id: 's-square', char: '■', labelKey: 'bead.preset.s-square', category: 'symbol' },
  { id: 's-triangle', char: '▲', labelKey: 'bead.preset.s-triangle', category: 'symbol' },
  { id: 's-spade', char: '♠', labelKey: 'bead.preset.s-spade', category: 'symbol' },
  { id: 's-club', char: '♣', labelKey: 'bead.preset.s-club', category: 'symbol' },
  { id: 's-diamond-h', char: '♦', labelKey: 'bead.preset.s-diamond-h', category: 'symbol' },
  { id: 's-check', char: '✔', labelKey: 'bead.preset.s-check', category: 'symbol' },
  { id: 's-cross', char: '✖', labelKey: 'bead.preset.s-cross', category: 'symbol' },
  { id: 's-arrow-r', char: '→', labelKey: 'bead.preset.s-arrow-r', category: 'symbol' },
  { id: 's-arrow-l', char: '←', labelKey: 'bead.preset.s-arrow-l', category: 'symbol' },
  { id: 's-arrow-u', char: '↑', labelKey: 'bead.preset.s-arrow-u', category: 'symbol' },
  { id: 's-arrow-d', char: '↓', labelKey: 'bead.preset.s-arrow-d', category: 'symbol' },
  { id: 's-music', char: '♪', labelKey: 'bead.preset.s-music', category: 'symbol' },
  { id: 's-note', char: '♫', labelKey: 'bead.preset.s-note', category: 'symbol' },
  { id: 's-copyright', char: '©', labelKey: 'bead.preset.s-copyright', category: 'symbol' },
  { id: 's-registered', char: '®', labelKey: 'bead.preset.s-registered', category: 'symbol' },
  { id: 's-trademark', char: '™', labelKey: 'bead.preset.s-trademark', category: 'symbol' },

  // Shapes (simple geometric)
  { id: 'sh-circle-o', char: '○', labelKey: 'bead.preset.sh-circle-o', category: 'shape' },
  { id: 'sh-square-o', char: '□', labelKey: 'bead.preset.sh-square-o', category: 'shape' },
  { id: 'sh-triangle-o', char: '△', labelKey: 'bead.preset.sh-triangle-o', category: 'shape' },
  { id: 'sh-diamond-o', char: '◇', labelKey: 'bead.preset.sh-diamond-o', category: 'shape' },
  { id: 'sh-hexagon', char: '⬡', labelKey: 'bead.preset.sh-hexagon', category: 'shape' },
  { id: 'sh-pentagon', char: '⬟', labelKey: 'bead.preset.sh-pentagon', category: 'shape' },
  { id: 'sh-octagon', char: '⬡', labelKey: 'bead.preset.sh-octagon', category: 'shape' },
  { id: 'sh-cross', char: '✚', labelKey: 'bead.preset.sh-cross', category: 'shape' },
  { id: 'sh-plus', char: '﹢', labelKey: 'bead.preset.sh-plus', category: 'shape' },
  { id: 'sh-ring', char: '◉', labelKey: 'bead.preset.sh-ring', category: 'shape' },
  { id: 'sh-bullseye', char: '⊕', labelKey: 'bead.preset.sh-bullseye', category: 'shape' },
  { id: 'sh-dot', char: '•', labelKey: 'bead.preset.sh-dot', category: 'shape' }
];

export function getPresetsByCategory(category: string): PresetItem[] {
  return PRESETS.filter((p) => p.category === category);
}

export function getPresetById(id: string): PresetItem | undefined {
  return PRESETS.find((p) => p.id === id);
}