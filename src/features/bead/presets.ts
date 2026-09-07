/** Pre-made emoji and symbol presets for the free canvas. */

export interface PresetItem {
  id: string;
  char: string;
  label: string;
  category: 'emoji' | 'symbol' | 'shape';
}

export const PRESET_CATEGORIES = ['emoji', 'symbol', 'shape'] as const;

export const PRESETS: PresetItem[] = [
  // Emoji
  { id: 'smile', char: '😊', label: 'Smile', category: 'emoji' },
  { id: 'heart', char: '❤️', label: 'Heart', category: 'emoji' },
  { id: 'star', char: '⭐', label: 'Star', category: 'emoji' },
  { id: 'fire', char: '🔥', label: 'Fire', category: 'emoji' },
  { id: 'thumbsup', char: '👍', label: 'Thumbs Up', category: 'emoji' },
  { id: 'clap', char: '👏', label: 'Clap', category: 'emoji' },
  { id: 'cry', char: '😢', label: 'Cry', category: 'emoji' },
  { id: 'laugh', char: '😂', label: 'Laugh', category: 'emoji' },
  { id: 'cool', char: '😎', label: 'Cool', category: 'emoji' },
  { id: 'wink', char: '😉', label: 'Wink', category: 'emoji' },
  { id: 'kiss', char: '😘', label: 'Kiss', category: 'emoji' },
  { id: 'angry', char: '😠', label: 'Angry', category: 'emoji' },
  { id: 'surprise', char: '😲', label: 'Surprise', category: 'emoji' },
  { id: 'thinking', char: '🤔', label: 'Thinking', category: 'emoji' },
  { id: 'love', char: '🥰', label: 'Love', category: 'emoji' },
  { id: 'sparkle', char: '✨', label: 'Sparkle', category: 'emoji' },
  { id: 'rainbow', char: '🌈', label: 'Rainbow', category: 'emoji' },
  { id: 'sun', char: '☀️', label: 'Sun', category: 'emoji' },
  { id: 'moon', char: '🌙', label: 'Moon', category: 'emoji' },
  { id: 'cloud', char: '☁️', label: 'Cloud', category: 'emoji' },
  { id: 'flower', char: '🌸', label: 'Flower', category: 'emoji' },
  { id: 'leaf', char: '🍃', label: 'Leaf', category: 'emoji' },
  { id: 'pizza', char: '🍕', label: 'Pizza', category: 'emoji' },
  { id: 'cake', char: '🎂', label: 'Cake', category: 'emoji' },
  { id: 'cat', char: '🐱', label: 'Cat', category: 'emoji' },
  { id: 'dog', char: '🐶', label: 'Dog', category: 'emoji' },
  { id: 'bunny', char: '🐰', label: 'Bunny', category: 'emoji' },
  { id: 'bear', char: '🐻', label: 'Bear', category: 'emoji' },
  { id: 'panda', char: '🐼', label: 'Panda', category: 'emoji' },
  { id: 'unicorn', char: '🦄', label: 'Unicorn', category: 'emoji' },

  // Symbols
  { id: 's-heart', char: '♥', label: 'Heart', category: 'symbol' },
  { id: 's-star', char: '★', label: 'Star', category: 'symbol' },
  { id: 's-diamond', char: '◆', label: 'Diamond', category: 'symbol' },
  { id: 's-circle', char: '●', label: 'Circle', category: 'symbol' },
  { id: 's-square', char: '■', label: 'Square', category: 'symbol' },
  { id: 's-triangle', char: '▲', label: 'Triangle', category: 'symbol' },
  { id: 's-spade', char: '♠', label: 'Spade', category: 'symbol' },
  { id: 's-club', char: '♣', label: 'Club', category: 'symbol' },
  { id: 's-diamond-h', char: '♦', label: 'Diamond', category: 'symbol' },
  { id: 's-check', char: '✔', label: 'Check', category: 'symbol' },
  { id: 's-cross', char: '✖', label: 'Cross', category: 'symbol' },
  { id: 's-arrow-r', char: '→', label: 'Arrow Right', category: 'symbol' },
  { id: 's-arrow-l', char: '←', label: 'Arrow Left', category: 'symbol' },
  { id: 's-arrow-u', char: '↑', label: 'Arrow Up', category: 'symbol' },
  { id: 's-arrow-d', char: '↓', label: 'Arrow Down', category: 'symbol' },
  { id: 's-music', char: '♪', label: 'Music', category: 'symbol' },
  { id: 's-note', char: '♫', label: 'Notes', category: 'symbol' },
  { id: 's-copyright', char: '©', label: 'Copyright', category: 'symbol' },
  { id: 's-registered', char: '®', label: 'Registered', category: 'symbol' },
  { id: 's-trademark', char: '™', label: 'Trademark', category: 'symbol' },

  // Shapes (simple geometric)
  { id: 'sh-circle-o', char: '○', label: 'Circle Outline', category: 'shape' },
  { id: 'sh-square-o', char: '□', label: 'Square Outline', category: 'shape' },
  { id: 'sh-triangle-o', char: '△', label: 'Triangle Outline', category: 'shape' },
  { id: 'sh-diamond-o', char: '◇', label: 'Diamond Outline', category: 'shape' },
  { id: 'sh-hexagon', char: '⬡', label: 'Hexagon', category: 'shape' },
  { id: 'sh-pentagon', char: '⬟', label: 'Pentagon', category: 'shape' },
  { id: 'sh-octagon', char: '⬡', label: 'Octagon', category: 'shape' },
  { id: 'sh-cross', char: '✚', label: 'Cross Shape', category: 'shape' },
  { id: 'sh-plus', char: '﹢', label: 'Plus', category: 'shape' },
  { id: 'sh-ring', char: '◉', label: 'Ring', category: 'shape' },
  { id: 'sh-bullseye', char: '⊕', label: 'Bullseye', category: 'shape' },
  { id: 'sh-dot', char: '•', label: 'Dot', category: 'shape' }
];

export function getPresetsByCategory(category: string): PresetItem[] {
  return PRESETS.filter((p) => p.category === category);
}

export function getPresetById(id: string): PresetItem | undefined {
  return PRESETS.find((p) => p.id === id);
}
