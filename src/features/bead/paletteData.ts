import type { BeadBrand, BeadColor } from './types';

// ── Symbols assigned to colors for symbol-view mode ──
const SYMBOLS = [
  '●', '■', '▲', '◆', '★', '◎', '⬟', '⬡',
  '♦', '♠', '♣', '♥', '◐', '◑', '◒', '◓',
  '▸', '▹', '▻', '▻', '◀', '▶', '▽', '△',
  '□', '○', '△', '☆', '⊕', '⊗', '⊙', '⊚',
  '◉', '◎', '◌', '◍', '◐', '◑', '◒', '◓',
  '⊕', '⊖', '⊘', '⊙', '⊚', '⊛', '⊜', '⊝',
  '❶', '❷', '❸', '❹', '❺', '❻', '❼', '❽',
  '❾', '❿', '⓫', '⓬', '⓭', '⓮', '⓯', '⓰',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
  'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
  'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
  'Y', 'Z', '0', '1', '2', '3', '4', '5',
  '6', '7', '8', '9', '+', '-', '=', '*', '/', '\\',
  'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ',
  'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'π', 'ρ',
  'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω'
];

export function getSymbol(index: number): string {
  return SYMBOLS[index % SYMBOLS.length];
}

function bc(code: string, name: string, hex: string, finish?: string): BeadColor {
  const value = parseInt(hex.slice(1), 16);
  return {
    code,
    name,
    hex,
    r: (value >> 16) & 0xff,
    g: (value >> 8) & 0xff,
    b: value & 0xff,
    finish
  };
}

// ── Artkal S Series (Solid / Opaque) ──
const artkalS: BeadBrand = {
  id: 'artkal-s',
  name: 'Artkal S (实色)',
  defaultBoardSize: 29,
  colors: [
    bc('S-01', 'White', '#FFFFFF', 'opaque'),
    bc('S-02', 'Cream', '#FFF8E1', 'opaque'),
    bc('S-03', 'Yellow', '#FFD600', 'opaque'),
    bc('S-04', 'Orange', '#FF9100', 'opaque'),
    bc('S-05', 'Red', '#E53935', 'opaque'),
    bc('S-06', 'Pink', '#F48FB1', 'opaque'),
    bc('S-07', 'Purple', '#7B1FA2', 'opaque'),
    bc('S-08', 'Blue', '#1E88E5', 'opaque'),
    bc('S-09', 'Sky Blue', '#4FC3F7', 'opaque'),
    bc('S-10', 'Green', '#43A047', 'opaque'),
    bc('S-11', 'Lime', '#8BC34A', 'opaque'),
    bc('S-12', 'Brown', '#6D4C41', 'opaque'),
    bc('S-13', 'Black', '#212121', 'opaque'),
    bc('S-14', 'Gray', '#9E9E9E', 'opaque'),
    bc('S-15', 'Light Gray', '#BDBDBD', 'opaque'),
    bc('S-16', 'Dark Blue', '#1565C0', 'opaque'),
    bc('S-17', 'Dark Green', '#2E7D32', 'opaque'),
    bc('S-18', 'Dark Red', '#B71C1C', 'opaque'),
    bc('S-19', 'Peach', '#FFCCBC', 'opaque'),
    bc('S-20', 'Light Pink', '#F8BBD0', 'opaque'),
    bc('S-21', 'Beige', '#D7CCC8', 'opaque'),
    bc('S-22', 'Tan', '#A1887F', 'opaque'),
    bc('S-23', 'Dark Brown', '#4E342E', 'opaque'),
    bc('S-24', 'Light Blue', '#81D4FA', 'opaque'),
    bc('S-25', 'Turquoise', '#26C6DA', 'opaque'),
    bc('S-26', 'Mint', '#80CBC4', 'opaque'),
    bc('S-27', 'Light Green', '#A5D6A7', 'opaque'),
    bc('S-28', 'Olive', '#9E9D24', 'opaque'),
    bc('S-29', 'Grape', '#CE93D8', 'opaque'),
    bc('S-30', 'Magenta', '#EC407A', 'opaque'),
    bc('S-31', 'Coral', '#FF7043', 'opaque'),
    bc('S-32', 'Salmon', '#FF8A65', 'opaque'),
    bc('S-33', 'Rust', '#BF360C', 'opaque'),
    bc('S-34', 'Sand', '#E6CEA0', 'opaque'),
    bc('S-35', 'Cherry', '#C62828', 'opaque'),
    bc('S-36', 'Lavender', '#B39DDB', 'opaque'),
    bc('S-37', 'Teal', '#00897B', 'opaque'),
    bc('S-38', 'Aqua', '#00BCD4', 'opaque'),
    bc('S-39', 'Navy', '#0D47A1', 'opaque'),
    bc('S-40', 'Charcoal', '#424242', 'opaque'),
    bc('S-41', 'Flesh', '#FFCBA4', 'opaque'),
    bc('S-42', 'Hot Pink', '#FF1493', 'opaque'),
    bc('S-43', 'Gold', '#FFD700', 'opaque'),
    bc('S-44', 'Bronze', '#CD7F32', 'opaque'),
    bc('S-45', 'Steel', '#78909C', 'opaque'),
    bc('S-46', 'Plum', '#6A1B9A', 'opaque'),
    bc('S-47', 'Forest', '#1B5E20', 'opaque'),
    bc('S-48', 'Aquamarine', '#00E5FF', 'opaque'),
    bc('S-49', 'Violet', '#9C27B0', 'opaque'),
    bc('S-50', 'Indigo', '#283593', 'opaque')
  ]
};

// ── Artkal C Series (Translucent) ──
const artkalC: BeadBrand = {
  id: 'artkal-c',
  name: 'Artkal C (透明)',
  defaultBoardSize: 29,
  colors: [
    bc('C-01', 'Transparent White', '#F5F5F5', 'translucent'),
    bc('C-02', 'Transparent Yellow', '#FFEB3B', 'translucent'),
    bc('C-03', 'Transparent Orange', '#FFA726', 'translucent'),
    bc('C-04', 'Transparent Red', '#EF5350', 'translucent'),
    bc('C-05', 'Transparent Pink', '#F48FB1', 'translucent'),
    bc('C-06', 'Transparent Purple', '#AB47BC', 'translucent'),
    bc('C-07', 'Transparent Blue', '#42A5F5', 'translucent'),
    bc('C-08', 'Transparent Light Blue', '#81D4FA', 'translucent'),
    bc('C-09', 'Transparent Green', '#66BB6A', 'translucent'),
    bc('C-10', 'Transparent Lime', '#AED581', 'translucent'),
    bc('C-11', 'Transparent Brown', '#8D6E63', 'translucent'),
    bc('C-12', 'Transparent Black', '#37474F', 'translucent'),
    bc('C-13', 'Transparent Gray', '#B0BEC5', 'translucent'),
    bc('C-14', 'Transparent Turquoise', '#4DD0E1', 'translucent'),
    bc('C-15', 'Transparent Grape', '#CE93D8', 'translucent'),
    bc('C-16', 'Transparent Coral', '#FF8A65', 'translucent'),
    bc('C-17', 'Transparent Teal', '#26A69A', 'translucent'),
    bc('C-18', 'Transparent Peach', '#FFCCBC', 'translucent'),
    bc('C-19', 'Transparent Gold', '#FFD54F', 'translucent'),
    bc('C-20', 'Transparent Magenta', '#EC407A', 'translucent')
  ]
};

// ── Perler Beads (Classic) ──
const perler: BeadBrand = {
  id: 'perler',
  name: 'Perler',
  defaultBoardSize: 29,
  colors: [
    bc('P-01', 'White', '#FFFFFF'),
    bc('P-02', 'Cream', '#FFF5C3'),
    bc('P-03', 'Yellow', '#FFD700'),
    bc('P-04', 'Orange', '#FF8C00'),
    bc('P-05', 'Red', '#D32F2F'),
    bc('P-06', 'Bubblegum', '#FF69B4'),
    bc('P-07', 'Purple', '#7B1FA2'),
    bc('P-08', 'Dark Blue', '#1565C0'),
    bc('P-09', 'Blue', '#1E88E5'),
    bc('P-10', 'Light Blue', '#64B5F6'),
    bc('P-11', 'Dark Green', '#2E7D32'),
    bc('P-12', 'Green', '#43A047'),
    bc('P-13', 'Light Green', '#81C784'),
    bc('P-14', 'Brown', '#5D4037'),
    bc('P-15', 'Light Brown', '#8D6E63'),
    bc('P-16', 'Gray', '#9E9E9E'),
    bc('P-17', 'Black', '#212121'),
    bc('P-18', 'Rust', '#BF360C'),
    bc('P-19', 'Magenta', '#C2185B'),
    bc('P-20', 'Pink', '#F06292'),
    bc('P-21', 'Peach', '#FFCCBC'),
    bc('P-22', 'Plum', '#6A1B9A'),
    bc('P-23', 'Bright Green', '#76FF03'),
    bc('P-24', 'Turquoise', '#00ACC1'),
    bc('P-25', 'Aqua', '#00BCD4'),
    bc('P-26', 'Salmon', '#FF8A80'),
    bc('P-27', 'Cherry', '#B71C1C'),
    bc('P-28', 'Tan', '#BCAAA4'),
    bc('P-29', 'Kiwi Lime', '#C6FF00'),
    bc('P-30', 'Hot Coral', '#FF5252'),
    bc('P-31', 'Pastel Yellow', '#FFF9C4'),
    bc('P-32', 'Pastel Green', '#C8E6C9'),
    bc('P-33', 'Pastel Blue', '#BBDEFB'),
    bc('P-34', 'Pastel Lavender', '#E1BEE7'),
    bc('P-35', 'Pastel Pink', '#F8BBD0'),
    bc('P-36', 'Light Pink', '#FCE4EC'),
    bc('P-37', 'Toothpaste', '#80DEEA'),
    bc('P-38', 'Sand', '#E6CEA0'),
    bc('P-39', 'Butterscotch', '#FFB74D'),
    bc('P-40', 'Robin Egg', '#80CBC4'),
    bc('P-41', 'Raspberry', '#D81B60'),
    bc('P-42', 'Hot Magenta', '#E040FB'),
    bc('P-43', 'Flamingo', '#FF80AB'),
    bc('P-44', 'Mulberry', '#AD1457'),
    bc('P-45', 'Eggplant', '#4A148C'),
    bc('P-46', 'Midnight', '#1A237E'),
    bc('P-47', 'Arctic Blue', '#B3E5FC'),
    bc('P-48', 'Glacier', '#4DD0E1'),
    bc('P-49', 'Jade', '#00897B'),
    bc('P-50', 'Treehouse', '#33691E'),
    bc('P-51', 'Olive', '#827717'),
    bc('P-52', 'Cheddar', '#F9A825'),
    bc('P-53', 'Pumpkin', '#E65100'),
    bc('P-54', 'Mahogany', '#3E2723'),
    bc('P-55', 'Eggshell', '#FFF8E1'),
    bc('P-56', 'Light Gray', '#CFD8DC'),
    bc('P-57', 'Dark Gray', '#616161'),
    bc('P-58', 'Charcoal', '#37474F')
  ]
};

// ── Hama Mini Beads ──
const hamaMini: BeadBrand = {
  id: 'hama-mini',
  name: 'Hama Mini',
  defaultBoardSize: 57,
  colors: [
    bc('H-01', 'White', '#FFFFFF'),
    bc('H-02', 'Cream', '#FFF8DC'),
    bc('H-03', 'Yellow', '#FFD700'),
    bc('H-04', 'Orange', '#FF8C00'),
    bc('H-05', 'Red', '#DC143C'),
    bc('H-06', 'Pink', '#FF69B4'),
    bc('H-07', 'Purple', '#800080'),
    bc('H-08', 'Dark Blue', '#00008B'),
    bc('H-09', 'Blue', '#0000FF'),
    bc('H-10', 'Light Blue', '#87CEEB'),
    bc('H-11', 'Green', '#008000'),
    bc('H-12', 'Light Green', '#90EE90'),
    bc('H-13', 'Brown', '#8B4513'),
    bc('H-14', 'Black', '#000000'),
    bc('H-15', 'Gray', '#808080'),
    bc('H-16', 'Dark Green', '#006400'),
    bc('H-17', 'Dark Red', '#8B0000'),
    bc('H-18', 'Beige', '#F5F5DC'),
    bc('H-19', 'Peach', '#FFDAB9'),
    bc('H-20', 'Light Brown', '#D2B48C'),
    bc('H-21', 'Dark Brown', '#3E2723'),
    bc('H-22', 'Turquoise', '#40E0D0'),
    bc('H-23', 'Light Purple', '#DDA0DD'),
    bc('H-24', 'Dark Purple', '#4B0082'),
    bc('H-25', 'Pastel Yellow', '#FFFACD'),
    bc('H-26', 'Pastel Green', '#98FB98'),
    bc('H-27', 'Pastel Blue', '#AEC6CF'),
    bc('H-28', 'Pastel Pink', '#FFD1DC'),
    bc('H-29', 'Pastel Lavender', '#E6E6FA'),
    bc('H-30', 'Mint', '#98FF98'),
    bc('H-31', 'Cherry', '#DE3163'),
    bc('H-32', 'Grape', '#6F2DA8'),
    bc('H-33', 'Rust', '#B7410E'),
    bc('H-34', 'Sand', '#C2B280'),
    bc('H-35', 'Salmon', '#FA8072'),
    bc('H-36', 'Teal', '#008080'),
    bc('H-37', 'Navy', '#000080'),
    bc('H-38', 'Aqua', '#00FFFF'),
    bc('H-39', 'Charcoal', '#36454F'),
    bc('H-40', 'Flesh', '#E8C39E'),
    bc('H-41', 'Lavender', '#B57EDC'),
    bc('H-42', 'Plum', '#8E4585'),
    bc('H-43', 'Indigo', '#4B0082'),
    bc('H-44', 'Magenta', '#FF00FF'),
    bc('H-45', 'Coral', '#FF7F50'),
    bc('H-46', 'Gold', '#FFD700'),
    bc('H-47', 'Bronze', '#CD7F32'),
    bc('H-48', 'Olive', '#808000'),
    bc('H-49', 'Aquamarine', '#7FFFD4'),
    bc('H-50', 'Forest', '#228B22')
  ]
};

/** All available bead brands. */
export const BEAD_BRANDS: BeadBrand[] = [artkalS, artkalC, perler, hamaMini];

/** Lookup a brand by ID. */
export function getBrand(id: string): BeadBrand {
  return BEAD_BRANDS.find((b) => b.id === id) ?? artkalS;
}
