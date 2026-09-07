import type { BeadBrand, BeadColor } from './types';

// ── Symbols assigned to colors for symbol-view mode ──
// Standard: A-Z letters for first 26, then A1/B1 etc.
const SYMBOLS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
  'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
  'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
  'Y', 'Z',
  'A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1',
  'I1', 'J1', 'K1', 'L1', 'M1', 'N1', 'O1', 'P1',
  'Q1', 'R1', 'S1', 'T1', 'U1', 'V1', 'W1', 'X1',
  'Y1', 'Z1',
  'A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2',
  'I2', 'J2', 'K2', 'L2', 'M2', 'N2', 'O2', 'P2',
  'Q2', 'R2', 'S2', 'T2', 'U2', 'V2', 'W2', 'X2',
  'Y2', 'Z2',
  'A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3',
  'I3', 'J3', 'K3', 'L3', 'M3', 'N3', 'O3', 'P3',
  'Q3', 'R3', 'S3', 'T3', 'U3', 'V3', 'W3', 'X3',
  'Y3', 'Z3'
];

export function getSymbol(index: number): string {
  return SYMBOLS[index % SYMBOLS.length];
}

function bc(code: string, name: string, hex: string, finish: BeadColor['finish'] = 'opaque', category?: string): BeadColor {
  const value = parseInt(hex.slice(1), 16);
  return {
    code,
    name,
    hex,
    r: (value >> 16) & 0xff,
    g: (value >> 8) & 0xff,
    b: value & 0xff,
    finish,
    category
  };
}

// ────────────────────────────────────────────────────────────────────
// MARD Standard 221-Color System (主流 221 色体系)
// A/B: 基础色系 | C: 蓝色系 | D: 绿色系 | E: 粉色系
// F: 黄/橙色系 | G: 棕/灰色系 | H: 白/黑/透明 | M: 特殊色系
// ────────────────────────────────────────────────────────────────────

// ── A 系列：基础色系 (红色/深红/酒红等基础色) ──
const seriesA = [
  bc('A1', '大红 Red', '#E53935', 'opaque', 'A系列-基础红'),
  bc('A2', '朱红 Vermilion', '#FF6B35', 'opaque', 'A系列-基础红'),
  bc('A3', '橙红 Orange-Red', '#FF5722', 'opaque', 'A系列-基础红'),
  bc('A4', '深红 Dark Red', '#B71C1C', 'opaque', 'A系列-基础红'),
  bc('A5', '酒红 Wine Red', '#880E4F', 'opaque', 'A系列-基础红'),
  bc('A6', '玫瑰红 Rose Red', '#C2185B', 'opaque', 'A系列-基础红'),
  bc('A7', '西瓜红 Watermelon', '#F06292', 'opaque', 'A系列-基础红'),
  bc('A8', '品红 Magenta', '#D81B60', 'opaque', 'A系列-基础红'),
  bc('A9', '桃红 Peach Blossom', '#F48FB1', 'opaque', 'A系列-基础红'),
  bc('A10', '浅红 Light Red', '#EF5350', 'opaque', 'A系列-基础红'),
  bc('A11', '肉粉 Flesh Pink', '#FFCCBC', 'opaque', 'A系列-基础红'),
  bc('A12', '珊瑚红 Coral', '#FF7043', 'opaque', 'A系列-基础红'),
  bc('A13', '铁锈红 Rust', '#BF360C', 'opaque', 'A系列-基础红'),
  bc('A14', '樱桃红 Cherry', '#C62828', 'opaque', 'A系列-基础红'),
  bc('A15', '草莓红 Strawberry', '#E91E63', 'opaque', 'A系列-基础红'),
  bc('A16', '树莓 Raspberry', '#AD1457', 'opaque', 'A系列-基础红'),
  bc('A17', '枣红 Date Red', '#7F0000', 'opaque', 'A系列-基础红'),
  bc('A18', '粉红 Pink', '#F8BBD0', 'opaque', 'A系列-基础红'),
  bc('A19', '浅粉 Light Pink', '#FCE4EC', 'opaque', 'A系列-基础红'),
  bc('A20', '胭脂红 Carmine', '#9B1B30', 'opaque', 'A系列-基础红'),
];

// ── B 系列：基础色系 (紫色/蓝色基础色) ──
const seriesB = [
  bc('B1', '紫罗兰 Violet', '#7B1FA2', 'opaque', 'B系列-紫色'),
  bc('B2', '紫色 Purple', '#9C27B0', 'opaque', 'B系列-紫色'),
  bc('B3', '浅紫 Light Purple', '#CE93D8', 'opaque', 'B系列-紫色'),
  bc('B4', '深紫 Dark Purple', '#6A1B9A', 'opaque', 'B系列-紫色'),
  bc('B5', '薰衣草 Lavender', '#B39DDB', 'opaque', 'B系列-紫色'),
  bc('B6', '淡紫 Pastel Purple', '#E1BEE7', 'opaque', 'B系列-紫色'),
  bc('B7', '葡萄紫 Grape', '#6F2DA8', 'opaque', 'B系列-紫色'),
  bc('B8', '梅子色 Plum', '#8E4585', 'opaque', 'B系列-紫色'),
  bc('B9', '茄子紫 Eggplant', '#4A148C', 'opaque', 'B系列-紫色'),
  bc('B10', '靛蓝 Indigo', '#283593', 'opaque', 'B系列-紫色'),
  bc('B11', '蓝紫 Blue-Violet', '#512DA8', 'opaque', 'B系列-紫色'),
  bc('B12', '粉紫 Pink-Purple', '#CE93D8', 'opaque', 'B系列-紫色'),
  bc('B13', '桑葚 Mulberry', '#AD1457', 'opaque', 'B系列-紫色'),
  bc('B14', '绀紫 Dark Violet', '#311B92', 'opaque', 'B系列-紫色'),
  bc('B15', '浅薰衣草 Light Lavender', '#D1C4E9', 'opaque', 'B系列-紫色'),
  bc('B16', '紫红色 Fuchsia', '#E040FB', 'opaque', 'B系列-紫色'),
  bc('B17', '玫红 Rose', '#EC407A', 'opaque', 'B系列-紫色'),
  bc('B18', '丁香 Lilac', '#B39DDB', 'opaque', 'B系列-紫色'),
];

// ── C 系列：蓝色系 ──
const seriesC = [
  bc('C1', '深蓝 Dark Blue', '#0D47A1', 'opaque', 'C系列-蓝色'),
  bc('C2', '宝蓝 Royal Blue', '#1565C0', 'opaque', 'C系列-蓝色'),
  bc('C3', '蓝色 Blue', '#1E88E5', 'opaque', 'C系列-蓝色'),
  bc('C4', '浅蓝 Light Blue', '#64B5F6', 'opaque', 'C系列-蓝色'),
  bc('C5', '天蓝 Sky Blue', '#4FC3F7', 'opaque', 'C系列-蓝色'),
  bc('C6', '淡蓝 Pastel Blue', '#BBDEFB', 'opaque', 'C系列-蓝色'),
  bc('C7', '藏青 Navy', '#0A2463', 'opaque', 'C系列-蓝色'),
  bc('C8', '午夜蓝 Midnight Blue', '#1A237E', 'opaque', 'C系列-蓝色'),
  bc('C9', '钴蓝 Cobalt Blue', '#1976D2', 'opaque', 'C系列-蓝色'),
  bc('C10', '湖蓝 Lake Blue', '#0288D1', 'opaque', 'C系列-蓝色'),
  bc('C11', '孔雀蓝 Peacock Blue', '#0097A7', 'opaque', 'C系列-蓝色'),
  bc('C12', '粉蓝 Baby Blue', '#B3E5FC', 'opaque', 'C系列-蓝色'),
  bc('C13', '冰蓝 Ice Blue', '#E1F5FE', 'opaque', 'C系列-蓝色'),
  bc('C14', '钢蓝 Steel Blue', '#5472D3', 'opaque', 'C系列-蓝色'),
  bc('C15', '海军蓝 Navy Blue', '#002B5C', 'opaque', 'C系列-蓝色'),
  bc('C16', '蔚蓝 Azure', '#0078D7', 'opaque', 'C系列-蓝色'),
  bc('C17', '浅天蓝 Light Sky Blue', '#81D4FA', 'opaque', 'C系列-蓝色'),
  bc('C18', '蓝灰 Blue Gray', '#5C6BC0', 'opaque', 'C系列-蓝色'),
  bc('C19', '长春花 Periwinkle', '#9FA8DA', 'opaque', 'C系列-蓝色'),
  bc('C20', '荧光蓝 Fluorescent Blue', '#00BFFF', 'glow', 'C系列-蓝色'),
  bc('C21', '普鲁士蓝 Prussian Blue', '#1A365D', 'opaque', 'C系列-蓝色'),
  bc('C22', '宝石蓝 Sapphire', '#0F4C81', 'opaque', 'C系列-蓝色'),
  bc('C23', '青蓝 Cyan-Blue', '#00ACC1', 'opaque', 'C系列-蓝色'),
  bc('C24', '冰川蓝 Glacier Blue', '#B3E5FC', 'opaque', 'C系列-蓝色'),
  bc('C25', '北极蓝 Arctic Blue', '#81D4FA', 'opaque', 'C系列-蓝色'),
];

// ── D 系列：绿色系 ──
const seriesD = [
  bc('D1', '深绿 Dark Green', '#1B5E20', 'opaque', 'D系列-绿色'),
  bc('D2', '绿色 Green', '#43A047', 'opaque', 'D系列-绿色'),
  bc('D3', '浅绿 Light Green', '#81C784', 'opaque', 'D系列-绿色'),
  bc('D4', '翠绿 Emerald Green', '#2E7D32', 'opaque', 'D系列-绿色'),
  bc('D5', '草绿 Grass Green', '#7CB342', 'opaque', 'D系列-绿色'),
  bc('D6', '黄绿 Yellow-Green', '#9CCC65', 'opaque', 'D系列-绿色'),
  bc('D7', '薄荷绿 Mint Green', '#80CBC4', 'opaque', 'D系列-绿色'),
  bc('D8', '青绿 Teal', '#00897B', 'opaque', 'D系列-绿色'),
  bc('D9', '橄榄绿 Olive', '#827717', 'opaque', 'D系列-绿色'),
  bc('D10', '淡绿 Pastel Green', '#C8E6C9', 'opaque', 'D系列-绿色'),
  bc('D11', '森林绿 Forest Green', '#2E7D32', 'opaque', 'D系列-绿色'),
  bc('D12', '青柠 Lime', '#8BC34A', 'opaque', 'D系列-绿色'),
  bc('D13', '抹茶绿 Matcha', '#AED581', 'opaque', 'D系列-绿色'),
  bc('D14', '翡翠 Jade', '#00897B', 'opaque', 'D系列-绿色'),
  bc('D15', '墨绿 Ink Green', '#1B5E20', 'opaque', 'D系列-绿色'),
  bc('D16', '苹果绿 Apple Green', '#AED581', 'opaque', 'D系列-绿色'),
  bc('D17', '豆绿 Bean Green', '#C5E1A5', 'opaque', 'D系列-绿色'),
  bc('D18', '军绿 Army Green', '#33691E', 'opaque', 'D系列-绿色'),
  bc('D19', '苔藓绿 Moss Green', '#556B2F', 'opaque', 'D系列-绿色'),
  bc('D20', '荧光绿 Fluorescent Green', '#76FF03', 'glow', 'D系列-绿色'),
  bc('D21', '浅青绿 Light Teal', '#26A69A', 'opaque', 'D系列-绿色'),
  bc('D22', '松柏绿 Pine Green', '#1B5E20', 'opaque', 'D系列-绿色'),
  bc('D23', '绿松 Turquoise', '#26C6DA', 'opaque', 'D系列-绿色'),
  bc('D24', '薄荷 Mint', '#A5D6A7', 'opaque', 'D系列-绿色'),
  bc('D25', '蓝绿 Blue-Green', '#0097A7', 'opaque', 'D系列-绿色'),
  bc('D26', '嫩绿 Tender Green', '#CCFF90', 'opaque', 'D系列-绿色'),
];

// ── E 系列：粉色系 ──
const seriesE = [
  bc('E1', '深粉 Dark Pink', '#C2185B', 'opaque', 'E系列-粉色'),
  bc('E2', '桃红 Peach', '#FFCDD2', 'opaque', 'E系列-粉色'),
  bc('E3', '樱花粉 Sakura', '#FCE4EC', 'opaque', 'E系列-粉色'),
  bc('E4', '豆沙 Pink Brown', '#BCAAA4', 'opaque', 'E系列-粉色'),
  bc('E5', '玫红 Rose Red', '#E91E63', 'opaque', 'E系列-粉色'),
  bc('E6', '珊瑚粉 Coral Pink', '#FF8A80', 'opaque', 'E系列-粉色'),
  bc('E7', '鲑鱼粉 Salmon', '#FA8072', 'opaque', 'E系列-粉色'),
  bc('E8', '泡泡糖粉 Bubblegum', '#FF69B4', 'opaque', 'E系列-粉色'),
  bc('E9', '水蜜桃 Peach', '#FFCCBC', 'opaque', 'E系列-粉色'),
  bc('E10', '淡粉 Baby Pink', '#F8BBD0', 'opaque', 'E系列-粉色'),
  bc('E11', '亮粉 Hot Pink', '#FF1493', 'opaque', 'E系列-粉色'),
  bc('E12', '浅粉 Light Pink', '#FCE4EC', 'opaque', 'E系列-粉色'),
  bc('E13', '樱花 Cherry Blossom', '#FFB7C5', 'opaque', 'E系列-粉色'),
  bc('E14', '杏色 Apricot', '#FFDAB9', 'opaque', 'E系列-粉色'),
  bc('E15', '粉橘 Pink-Orange', '#FFAB91', 'opaque', 'E系列-粉色'),
  bc('E16', '芙蓉粉 Hibiscus', '#FF80AB', 'opaque', 'E系列-粉色'),
  bc('E17', '糖霜粉 Frosting', '#F8BBD0', 'opaque', 'E系列-粉色'),
  bc('E18', '玫瑰 Rose', '#F48FB1', 'opaque', 'E系列-粉色'),
  bc('E19', '洋红 Magenta', '#D81B60', 'opaque', 'E系列-粉色'),
  bc('E20', '粉紫 Pink-Purple', '#F48FB1', 'opaque', 'E系列-粉色'),
  bc('E21', '肤粉色 Skin Pink', '#FFCBA4', 'opaque', 'E系列-粉色'),
  bc('E22', '胭脂 Rouge', '#C2185B', 'opaque', 'E系列-粉色'),
  bc('E23', '莓果 Berry', '#AD1457', 'opaque', 'E系列-粉色'),
  bc('E24', '糖果粉 Candy Pink', '#F48FB1', 'opaque', 'E系列-粉色'),
  bc('E25', '樱花浅粉 Light Sakura', '#FFE0E6', 'opaque', 'E系列-粉色'),
];

// ── F 系列：黄色/橙色系 ──
const seriesF = [
  bc('F1', '柠檬黄 Lemon Yellow', '#FFEB3B', 'opaque', 'F系列-黄橙'),
  bc('F2', '中黄 Medium Yellow', '#FFD600', 'opaque', 'F系列-黄橙'),
  bc('F3', '深黄 Deep Yellow', '#FFAB00', 'opaque', 'F系列-黄橙'),
  bc('F4', '奶黄 Cream Yellow', '#FFF8E1', 'opaque', 'F系列-黄橙'),
  bc('F5', '鹅黄 Light Yellow', '#FFF9C4', 'opaque', 'F系列-黄橙'),
  bc('F6', '橙 Orange', '#FF9100', 'opaque', 'F系列-黄橙'),
  bc('F7', '深橙 Dark Orange', '#E65100', 'opaque', 'F系列-黄橙'),
  bc('F8', '浅橙 Light Orange', '#FFB74D', 'opaque', 'F系列-黄橙'),
  bc('F9', '金黄 Golden Yellow', '#FFD700', 'opaque', 'F系列-黄橙'),
  bc('F10', '土黄 Earth Yellow', '#D4A017', 'opaque', 'F系列-黄橙'),
  bc('F11', '芥末黄 Mustard', '#F9A825', 'opaque', 'F系列-黄橙'),
  bc('F12', '橘红 Tangerine', '#FF6D00', 'opaque', 'F系列-黄橙'),
  bc('F13', '蜂蜜色 Honey', '#FFB300', 'opaque', 'F系列-黄橙'),
  bc('F14', '玉米黄 Corn Yellow', '#FFEB3B', 'opaque', 'F系列-黄橙'),
  bc('F15', '米黄 Beige Yellow', '#FFF8E1', 'opaque', 'F系列-黄橙'),
  bc('F16', '杏黄 Apricot Yellow', '#FFCC80', 'opaque', 'F系列-黄橙'),
  bc('F17', '琥珀色 Amber', '#FF8F00', 'opaque', 'F系列-黄橙'),
  bc('F18', '南瓜橙 Pumpkin', '#E65100', 'opaque', 'F系列-黄橙'),
  bc('F19', '姜黄 Ginger', '#F57F17', 'opaque', 'F系列-黄橙'),
  bc('F20', '荧光黄 Fluorescent Yellow', '#FFEA00', 'glow', 'F系列-黄橙'),
  bc('F21', '米白 Off-White', '#FAFAD2', 'opaque', 'F系列-黄橙'),
  bc('F22', '奶油 Cream', '#FFFDD0', 'opaque', 'F系列-黄橙'),
  bc('F23', '芒果黄 Mango', '#FFA726', 'opaque', 'F系列-黄橙'),
  bc('F24', '菠萝 Pineapple', '#FFD54F', 'opaque', 'F系列-黄橙'),
  bc('F25', '柠檬绿 Lemon Lime', '#C6FF00', 'opaque', 'F系列-黄橙'),
  bc('F26', '淡黄 Pastel Yellow', '#FFF9C4', 'opaque', 'F系列-黄橙'),
];

// ── G 系列：棕色/灰色系 ──
const seriesG = [
  bc('G1', '深棕 Dark Brown', '#3E2723', 'opaque', 'G系列-棕灰'),
  bc('G2', '棕色 Brown', '#6D4C41', 'opaque', 'G系列-棕灰'),
  bc('G3', '浅棕 Light Brown', '#8D6E63', 'opaque', 'G系列-棕灰'),
  bc('G4', '咖啡 Coffee', '#4E342E', 'opaque', 'G系列-棕灰'),
  bc('G5', '巧克力 Chocolate', '#5D4037', 'opaque', 'G系列-棕灰'),
  bc('G6', '驼色 Camel', '#B8860B', 'opaque', 'G系列-棕灰'),
  bc('G7', '卡其 Khaki', '#C3B091', 'opaque', 'G系列-棕灰'),
  bc('G8', '米色 Beige', '#D7CCC8', 'opaque', 'G系列-棕灰'),
  bc('G9', '沙色 Sand', '#E6CEA0', 'opaque', 'G系列-棕灰'),
  bc('G10', '浅灰 Light Gray', '#E0E0E0', 'opaque', 'G系列-棕灰'),
  bc('G11', '灰色 Gray', '#9E9E9E', 'opaque', 'G系列-棕灰'),
  bc('G12', '深灰 Dark Gray', '#616161', 'opaque', 'G系列-棕灰'),
  bc('G13', '炭灰 Charcoal', '#424242', 'opaque', 'G系列-棕灰'),
  bc('G14', '银灰 Silver Gray', '#BDBDBD', 'opaque', 'G系列-棕灰'),
  bc('G15', '烟灰 Ash Gray', '#757575', 'opaque', 'G系列-棕灰'),
  bc('G16', '棕褐 Tan', '#A1887F', 'opaque', 'G系列-棕灰'),
  bc('G17', '古铜 Bronze', '#CD7F32', 'opaque', 'G系列-棕灰'),
  bc('G18', '红棕 Red Brown', '#795548', 'opaque', 'G系列-棕灰'),
  bc('G19', '黄棕 Yellow Brown', '#8D6E63', 'opaque', 'G系列-棕灰'),
  bc('G20', '灰蓝 Gray-Blue', '#78909C', 'opaque', 'G系列-棕灰'),
  bc('G21', '暖棕 Warm Brown', '#795548', 'opaque', 'G系列-棕灰'),
  bc('G22', '冷棕 Cool Brown', '#6D4C41', 'opaque', 'G系列-棕灰'),
  bc('G23', '铁灰 Iron Gray', '#78909C', 'opaque', 'G系列-棕灰'),
  bc('G24', '米驼 Rice', '#D7CCC8', 'opaque', 'G系列-棕灰'),
  bc('G25', '可可色 Cocoa', '#5D4037', 'opaque', 'G系列-棕灰'),
  bc('G26', '灰绿 Gray-Green', '#88A0A8', 'opaque', 'G系列-棕灰'),
  bc('G27', '奶咖 Latte', '#BCAAA4', 'opaque', 'G系列-棕灰'),
  bc('G28', '棕红 Brown-Red', '#6D4C41', 'opaque', 'G系列-棕灰'),
  bc('G29', '浅米 Light Beige', '#EFEBE9', 'opaque', 'G系列-棕灰'),
  bc('G30', '深炭 Dark Charcoal', '#303030', 'opaque', 'G系列-棕灰'),
];

// ── H 系列：白色/黑色/透明色 ──
const seriesH = [
  bc('H1', '白色 White', '#FFFFFF', 'opaque', 'H系列-白黑透明'),
  bc('H2', '黑色 Black', '#212121', 'opaque', 'H系列-白黑透明'),
  bc('H3', '米白 Cream White', '#FFF8E1', 'opaque', 'H系列-白黑透明'),
  bc('H4', '灰白 Off-White', '#F5F5F5', 'opaque', 'H系列-白黑透明'),
  bc('H5', '纯白 Pure White', '#FFFFFF', 'opaque', 'H系列-白黑透明'),
  bc('H6', '乳白 Milky White', '#FFFAF0', 'opaque', 'H系列-白黑透明'),
  bc('H7', '透明白 Transparent White', '#F5F5F5', 'translucent', 'H系列-白黑透明'),
  bc('H8', '透明黑 Transparent Black', '#37474F', 'translucent', 'H系列-白黑透明'),
  bc('H9', '透明红 Transparent Red', '#EF5350', 'translucent', 'H系列-白黑透明'),
  bc('H10', '透明蓝 Transparent Blue', '#42A5F5', 'translucent', 'H系列-白黑透明'),
  bc('H11', '透明绿 Transparent Green', '#66BB6A', 'translucent', 'H系列-白黑透明'),
  bc('H12', '透明黄 Transparent Yellow', '#FFEB3B', 'translucent', 'H系列-白黑透明'),
  bc('H13', '透明粉 Transparent Pink', '#F48FB1', 'translucent', 'H系列-白黑透明'),
  bc('H14', '透明紫 Transparent Purple', '#AB47BC', 'translucent', 'H系列-白黑透明'),
  bc('H15', '透明橙 Transparent Orange', '#FFA726', 'translucent', 'H系列-白黑透明'),
  bc('H16', '透明灰 Transparent Gray', '#B0BEC5', 'translucent', 'H系列-白黑透明'),
  bc('H17', '夜光 Glow in Dark', '#E8F5E9', 'glow', 'H系列-白黑透明'),
  bc('H18', '荧光粉 Glow Pink', '#FF80AB', 'glow', 'H系列-白黑透明'),
  bc('H19', '荧光黄 Glow Yellow', '#FFFF00', 'glow', 'H系列-白黑透明'),
  bc('H20', '荧光绿 Glow Green', '#00FF00', 'glow', 'H系列-白黑透明'),
  bc('H21', '透明青 Transparent Cyan', '#4DD0E1', 'translucent', 'H系列-白黑透明'),
  bc('H22', '透明棕 Transparent Brown', '#8D6E63', 'translucent', 'H系列-白黑透明'),
];

// ── M 系列：特殊色系 (金属/闪粉/夜光等) ──
const seriesM = [
  bc('M1', '金色 Gold', '#FFD700', 'metallic', 'M系列-特殊'),
  bc('M2', '银色 Silver', '#C0C0C0', 'metallic', 'M系列-特殊'),
  bc('M3', '铜色 Copper', '#B87333', 'metallic', 'M系列-特殊'),
  bc('M4', '玫瑰金 Rose Gold', '#B76E79', 'metallic', 'M系列-特殊'),
  bc('M5', '彩虹 Rainbow', '#FFFFFF', 'special', 'M系列-特殊'),
  bc('M6', '荧光红 Fluorescent Red', '#FF1744', 'glow', 'M系列-特殊'),
  bc('M7', '荧光蓝 Fluorescent Blue', '#00B0FF', 'glow', 'M系列-特殊'),
  bc('M8', '荧光绿 Fluorescent Green', '#76FF03', 'glow', 'M系列-特殊'),
  bc('M9', '荧光粉 Fluorescent Pink', '#F06292', 'glow', 'M系列-特殊'),
  bc('M10', '夜光黄 Glow Yellow', '#FFF59D', 'glow', 'M系列-特殊'),
  bc('M11', '夜光绿 Glow Green', '#C5E1A5', 'glow', 'M系列-特殊'),
  bc('M12', '闪粉银 Glitter Silver', '#E0E0E0', 'glitter', 'M系列-特殊'),
  bc('M13', '闪粉金 Glitter Gold', '#FFD54F', 'glitter', 'M系列-特殊'),
  bc('M14', '马卡龙粉 Macaron Pink', '#FFCDD2', 'opaque', 'M系列-特殊'),
  bc('M15', '马卡龙蓝 Macaron Blue', '#BBDEFB', 'opaque', 'M系列-特殊'),
  bc('M16', '马卡龙绿 Macaron Green', '#C8E6C9', 'opaque', 'M系列-特殊'),
  bc('M17', '马卡龙黄 Macaron Yellow', '#FFF9C4', 'opaque', 'M系列-特殊'),
  bc('M18', '马卡龙紫 Macaron Purple', '#E1BEE7', 'opaque', 'M系列-特殊'),
  bc('M19', '肤色 Flesh', '#FFCBA4', 'opaque', 'M系列-特殊'),
  bc('M20', '浅肤色 Light Flesh', '#FFE0B2', 'opaque', 'M系列-特殊'),
  bc('M21', '深肤色 Dark Flesh', '#D7A77A', 'opaque', 'M系列-特殊'),
  bc('M22', '大理石 Marble', '#ECEFF1', 'special', 'M系列-特殊'),
];

// ── 汇总: MARD 221色体系 ──
const mard221 = [
  ...seriesA, ...seriesB, ...seriesC, ...seriesD,
  ...seriesE, ...seriesF, ...seriesG, ...seriesH,
  ...seriesM
];

const mardBrand: BeadBrand = {
  id: 'mard-standard',
  name: 'MARD 主流221色 (A-H-M系列)',
  defaultBoardSize: 29,
  colors: mard221
};

// ──────────────────────────────────────────────────────────
// Artkal S Series (实色) - 兼容主流色号
// ──────────────────────────────────────────────────────────
const artkalS: BeadBrand = {
  id: 'artkal-s',
  name: 'Artkal S 实色系列',
  defaultBoardSize: 29,
  colors: mard221.map((c) => ({
    ...c,
    code: 'S-' + c.code,
  }))
};

// ──────────────────────────────────────────────────────────
// Perler 品牌色号
// ──────────────────────────────────────────────────────────
const perler: BeadBrand = {
  id: 'perler',
  name: 'Perler 拼豆',
  defaultBoardSize: 29,
  colors: mard221.filter((c) => c.finish === 'opaque').slice(0, 58).map((c, i) => ({
    ...c,
    code: 'P-' + String(i + 1).padStart(2, '0'),
  }))
};

// ──────────────────────────────────────────────────────────
// Hama Mini 迷你拼豆
// ──────────────────────────────────────────────────────────
const hamaMini: BeadBrand = {
  id: 'hama-mini',
  name: 'Hama Mini 迷你拼豆',
  defaultBoardSize: 57,
  colors: mard221.filter((c) => c.finish === 'opaque').slice(0, 50).map((c, i) => ({
    ...c,
    code: 'H-' + String(i + 1).padStart(2, '0'),
  }))
};

// ── All brands ──
export const BEAD_BRANDS: BeadBrand[] = [mardBrand, artkalS, perler, hamaMini];

/** Lookup a brand by ID. */
export function getBrand(id: string): BeadBrand {
  return BEAD_BRANDS.find((b) => b.id === id) ?? mardBrand;
}
