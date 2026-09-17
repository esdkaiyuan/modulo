import type { PatternResult } from './types';
import { renderPattern } from './patternRenderer';
import { getBrand, brandName } from './paletteData';
import { buildExport, downloadBlobFile, downloadExport } from '../shared/exportVariants';
import { colorValueChunks, sanitizeIdentifier } from '../../engines/outputFormatter';
import { t } from '../../i18n';

/**
 * Export the pattern as a PNG image.
 */
export function exportPng(pattern: PatternResult, title?: string, showColorCodes = false): void {
  const canvas = renderPattern(pattern, {
    cellSize: showColorCodes ? 64 : 48,
    showGrid: true,
    showCoordinates: true,
    showBoardLines: true,
    showCenterCrosshair: true,
    showColorCodes,
    showLegend: true,
    title: title || `${t('bead.printTitle')} — ${pattern.width}×${pattern.height}`
  });

  canvas.toBlob((blob) => {
    if (!blob) return;
    downloadBlobFile(blob, sanitizeFilename(title || `bead_pattern_${pattern.width}x${pattern.height}`) + '.png');
  }, 'image/png');
}

/**
 * Export the pattern as a JPEG image.
 */
export function exportJpeg(pattern: PatternResult, title?: string, showColorCodes = false): void {
  const canvas = renderPattern(pattern, {
    cellSize: showColorCodes ? 64 : 48,
    showGrid: true,
    showCoordinates: true,
    showBoardLines: true,
    showCenterCrosshair: true,
    showColorCodes,
    showLegend: true,
    title: title || `${t('bead.printTitle')} — ${pattern.width}×${pattern.height}`
  });

  canvas.toBlob((blob) => {
    if (!blob) return;
    downloadBlobFile(blob, sanitizeFilename(title || `bead_pattern_${pattern.width}x${pattern.height}`) + '.jpg');
  }, 'image/jpeg', 0.92);
}

/**
 * Open the browser print dialog with a print-optimized layout.
 * The user can then save as PDF from the print dialog.
 */
export function exportPrint(pattern: PatternResult, title?: string, showColorCodes = false): void {
  const canvas = renderPattern(pattern, {
    cellSize: showColorCodes ? 48 : 32,
    showColorCodes,
    showGrid: true,
    showCoordinates: true,
    showBoardLines: true,
    showCenterCrosshair: true,
    showLegend: true,
    title: title || `${t('bead.printTitle')} — ${pattern.width}×${pattern.height}`
  });

  const dataUrl = canvas.toDataURL('image/png');
  const brand = getBrand(pattern.brandId);

  const printHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title || t('bead.printTitle')}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Inter", "Segoe UI", "Microsoft YaHei", sans-serif;
    color: #18202e;
    background: #fff;
    padding: 20px;
  }
  .header { margin-bottom: 16px; }
  .header h1 { font-size: 20px; font-weight: 700; }
  .header p { font-size: 12px; color: #5d6b81; margin-top: 4px; }
  .pattern-img {
    max-width: 100%;
    height: auto;
    image-rendering: pixelated;
  }
  .materials-table {
    margin-top: 20px;
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
  }
  .materials-table th {
    text-align: left;
    padding: 6px 8px;
    border-bottom: 2px solid #e2e7f0;
    font-weight: 700;
    font-size: 10px;
    text-transform: uppercase;
    color: #5d6b81;
  }
  .materials-table td {
    padding: 4px 8px;
    border-bottom: 1px solid #f0f0f0;
  }
  .swatch {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 2px;
    border: 1px solid #d0d0d0;
    vertical-align: middle;
    margin-right: 6px;
  }
  .footer {
    margin-top: 16px;
    font-size: 10px;
    color: #9e9e9e;
    text-align: center;
  }
  @page {
    size: A4 landscape;
    margin: 10mm;
  }
  @media print {
    body { padding: 0; }
  }
</style>
</head>
<body>
  <div class="header">
    <h1>${title || t('bead.printTitle')}</h1>
    <p>${t('bead.printStats', { w: pattern.width, h: pattern.height, beads: pattern.totalBeads, colors: pattern.materials.length, brand: brandName(brand), board: pattern.boardSize })}</p>
  </div>
  <img class="pattern-img" src="${dataUrl}" alt="${t('bead.printTitle')}" />
  <table class="materials-table">
    <thead>
      <tr>
        <th></th>
        <th>${t('bead.colSymbol')}</th>
        <th>${t('bead.colCode')}</th>
        <th>${t('bead.colColorName')}</th>
        <th style="text-align:right">${t('bead.colCount')}</th>
        <th style="text-align:right">%</th>
      </tr>
    </thead>
    <tbody>
      ${pattern.materials.map((m) => `
        <tr>
          <td><span class="swatch" style="background:${m.bead.hex}"></span></td>
          <td style="font-family:monospace">${m.symbol}</td>
          <td>${m.bead.code}</td>
          <td>${m.bead.name}</td>
          <td style="text-align:right;font-family:monospace">${m.count}</td>
          <td style="text-align:right;font-family:monospace">${m.percentage.toFixed(1)}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <div class="footer">
    ${t('bead.printFooter')} · ${new Date().toLocaleDateString()}
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printHtml);
    printWindow.document.close();
    // Wait for image to load before triggering print
    const img = printWindow.document.querySelector('img') as HTMLImageElement | null;
    if (img) {
      img.onload = () => printWindow.print();
    } else {
      printWindow.print();
    }
  }
}

/**
 * Export the materials list as CSV.
 */
export function exportCsv(pattern: PatternResult, title?: string): void {
  const brand = getBrand(pattern.brandId);
  const rows = [
    [t('bead.colSymbol'), t('bead.colCode'), t('bead.colColorName'), t('bead.colHex'), t('bead.colCount'), t('bead.colPercent'), t('bead.colBrand')].join(','),
    ...pattern.materials.map((m) =>
      [
        m.symbol,
        m.bead.code,
        `"${m.bead.name}"`,
        m.bead.hex,
        m.count,
        m.percentage.toFixed(1) + '%',
        `"${brandName(brand)}"`
      ].join(',')
    )
  ];
  rows.push('');
  rows.push(`"${t('bead.csvTotal')}",,,,${pattern.totalBeads},,"${pattern.width}×${pattern.height}"`);

  const content = rows.join('\n');
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8' });
  downloadBlobFile(blob, sanitizeFilename(title || `bead_materials_${pattern.width}x${pattern.height}`) + '.csv');
}

/**
 * Export the full pattern data as JSON.
 */
export function exportJson(pattern: PatternResult, title?: string): void {
  const data = {
    title: title || '',
    width: pattern.width,
    height: pattern.height,
    brand: pattern.brandId,
    boardSize: pattern.boardSize,
    totalBeads: pattern.totalBeads,
    materials: pattern.materials.map((m) => ({
      symbol: m.symbol,
      code: m.bead.code,
      name: m.bead.name,
      hex: m.bead.hex,
      count: m.count,
      percentage: +m.percentage.toFixed(1)
    })),
    grid: pattern.cells.map((row) =>
      row.map((cell) => cell?.bead?.code ?? null)
    )
  };

  const content = JSON.stringify(data, null, 2);
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  downloadBlobFile(blob, sanitizeFilename(title || `bead_pattern_${pattern.width}x${pattern.height}`) + '.json');
}

/** sRGB → RGB565, big-endian byte order. */
function toRgb565(r: number, g: number, b: number): number {
  return ((r & 0xf8) << 8) | ((g & 0xfc) << 3) | (b >> 3);
}

/**
 * Build embedded-ready C source for the pattern: an RGB565 palette plus one
 * index byte per cell (0 = empty, 1..n = materials order shown in the legend).
 */
export function buildBeadCArray(pattern: PatternResult, title?: string): string {
  const name = sanitizeIdentifier(title || `bead_pattern_${pattern.width}x${pattern.height}`);
  const indexOf = new Map<string, number>();
  pattern.materials.forEach((material, index) => indexOf.set(material.bead.code, index + 1));

  const paletteBytes = new Uint8Array(pattern.materials.length * 2);
  pattern.materials.forEach((material, index) => {
    const word = toRgb565(material.bead.r, material.bead.g, material.bead.b);
    paletteBytes[index * 2] = (word >> 8) & 0xff;
    paletteBytes[index * 2 + 1] = word & 0xff;
  });

  const cells = new Uint8Array(pattern.width * pattern.height);
  pattern.cells.forEach((row, r) => {
    row.forEach((cell, c) => {
      cells[r * pattern.width + c] = cell?.bead ? indexOf.get(cell.bead.code) ?? 0 : 0;
    });
  });

  const lines: string[] = [
    `// 拼豆图案 / Bead pattern: ${title || `${pattern.width}x${pattern.height}`}`,
    `// 分辨率 / Resolution: ${pattern.width}x${pattern.height}, ${pattern.materials.length} colors`,
    `// 品牌 / Brand: ${brandName(getBrand(pattern.brandId))}`,
    `// 拼豆板 / Board: ${pattern.boardSize}x${pattern.boardSize}, 需要 / boards needed: ${pattern.boardCount}`,
    `// 豆珠总数 / Total beads: ${pattern.totalBeads}`,
    '//',
    '// 索引 0 = 空格 / empty, 1..n = 按下列物料顺序 / materials order below',
    '// idx  symbol  code  name  hex  count'
  ];
  pattern.materials.forEach((material, index) => {
    lines.push(
      `// ${String(index + 1).padStart(3)}  ${material.symbol.padEnd(6)}  ${material.bead.code.padEnd(6)}  `
      + `${material.bead.name}  ${material.bead.hex}  ${material.count}`
    );
  });
  lines.push('');
  lines.push(`const uint16_t ${name}_palette[] PROGMEM = {`);
  const paletteLines = colorValueChunks(paletteBytes, 'rgb565', 'big', 8);
  paletteLines.forEach((chunk, index) => {
    lines.push(`  ${chunk}${index < paletteLines.length - 1 ? ',' : ''}`);
  });
  lines.push('};', '');
  lines.push(`const uint8_t ${name}[] PROGMEM = {`);
  const cellLines = colorValueChunks(cells, 'rgb888', 'big', 16);
  cellLines.forEach((chunk, index) => {
    lines.push(`  ${chunk}${index < cellLines.length - 1 ? ',' : ''}`);
  });
  lines.push('};');
  return lines.join('\n');
}

/**
 * Export the pattern as an embedded C header (palette + per-cell indices).
 */
export function exportCArray(pattern: PatternResult, title?: string): void {
  const name = sanitizeIdentifier(title || `bead_pattern_${pattern.width}x${pattern.height}`);
  const source = buildBeadCArray(pattern, title);
  downloadExport(name, buildExport('h', { name, source, width: pattern.width, height: pattern.height }));
}

/**
 * Export one row per bead with its 1-based board position, for physical placement.
 */
export function exportCoordinatesCsv(pattern: PatternResult, title?: string): void {
  const rows = [[t('bead.colRow'), t('bead.colCol'), t('bead.colSymbol'), t('bead.colCode'), t('bead.colColorName'), t('bead.colHex')].join(',')];
  pattern.cells.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (!cell?.bead) return;
      rows.push([r + 1, c + 1, cell.symbol, cell.bead.code, `"${cell.bead.name}"`, cell.bead.hex].join(','));
    });
  });

  const blob = new Blob(['﻿' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
  downloadBlobFile(blob, sanitizeFilename(title || `bead_coords_${pattern.width}x${pattern.height}`) + '.csv');
}

// ── Helpers ──

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-一-鿿]/g, '_').replace(/_+/g, '_');
}
