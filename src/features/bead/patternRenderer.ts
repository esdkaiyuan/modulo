import type { PatternCell, PatternResult, PatternSettings } from './types';
import { getBoardGrid } from './patternEngine';
import { getBrand, brandName } from './paletteData';
import { t } from '../../i18n';

export interface RenderOptions {
  /** Pixel size of each bead cell */
  cellSize: number;
  /** Show grid lines between beads */
  showGrid: boolean;
  /** Show coordinate labels */
  showCoordinates: boolean;
  /** Show board boundary lines */
  showBoardLines: boolean;
  /** Show center crosshair */
  showCenterCrosshair: boolean;
  /** View mode */
  viewMode: 'colors' | 'symbols' | 'both';
  /** Show color code labels on each bead */
  showColorCodes: boolean;
  /** Show legend */
  showLegend: boolean;
  /** Show title */
  title: string;
}

const DEFAULT_OPTIONS: RenderOptions = {
  cellSize: 20,
  showGrid: true,
  showCoordinates: true,
  showBoardLines: true,
  showCenterCrosshair: true,
  viewMode: 'colors',
  showColorCodes: false,
  showLegend: true,
  title: ''
};

/** Row labels: A, B, C, … Z, AA, AB, … */
function rowLabel(index: number): string {
  let label = '';
  let n = index;
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

/**
 * Label drawn inside a bead when color codes are on. Long manufacturer codes
 * (e.g. Perler SKUs like `80-19001`) don't fit on a bead, so they fall back to
 * the legend symbol — the printed legend maps the symbol back to the code.
 */
export function colorLabel(code: string, symbol: string): string {
  return code.length <= 4 ? code.replace('-', '') : symbol;
}

/**
 * Render a bead pattern to a canvas. Returns the canvas element.
 */
export function renderPattern(
  pattern: PatternResult,
  options?: Partial<RenderOptions>
): HTMLCanvasElement {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { width, height, cells, materials } = pattern;
  const cell = opts.cellSize;

  // Layout calculations
  const coordLeft = opts.showCoordinates ? 36 : 0;
  const coordTop = opts.showCoordinates ? 28 : 0;
  const gridW = width * cell;
  const gridH = height * cell;

  // Legend dimensions
  const legendCols = Math.min(4, materials.length);
  const legendRows = Math.ceil(materials.length / legendCols);
  const legendItemH = 28;
  const legendPad = 16;
  const legendW = opts.showLegend ? Math.max(gridW, legendCols * 220 + legendPad * 2) : 0;
  const legendH = opts.showLegend ? legendRows * legendItemH + legendPad * 2 + 28 : 0;

  // Title area
  const titleH = opts.title ? 40 : 0;

  const totalW = coordLeft + gridW + 16 + (opts.showLegend ? 20 : 0);
  const totalH = coordTop + gridH + titleH + legendH + 20;

  const canvas = document.createElement('canvas');
  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, totalW, totalH);

  // Title
  if (opts.title) {
    ctx.fillStyle = '#18202e';
    ctx.font = 'bold 16px "Inter", "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(opts.title, coordLeft, 18);

    // Subtitle with stats
    ctx.fillStyle = '#5d6b81';
    ctx.font = '12px "Inter", "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText(
      t('bead.renderSubtitle', {
        w: width,
        h: height,
        beads: pattern.totalBeads,
        colors: materials.length,
        brand: brandName(getBrand(pattern.brandId))
      }),
      coordLeft,
      34
    );
  }

  const offsetY = coordTop + titleH;

  // Column numbers (top)
  if (opts.showCoordinates) {
    ctx.fillStyle = '#5d6b81';
    ctx.font = '10px "Cascadia Code", "Fira Code", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    for (let x = 0; x < width; x++) {
      ctx.fillText(String(x + 1), coordLeft + x * cell + cell / 2, offsetY - 3);
    }

    // Row labels (left)
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = 0; y < height; y++) {
      ctx.fillText(rowLabel(y), coordLeft - 5, offsetY + y * cell + cell / 2);
    }
  }

  // Draw beads
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const cellData = cells[row]?.[col];
      const x = coordLeft + col * cell;
      const y = offsetY + row * cell;

      if (!cellData?.bead) {
        // Empty cell — light gray background
        ctx.fillStyle = '#F0F0F0';
        ctx.fillRect(x, y, cell, cell);
        continue;
      }

      const bead = cellData.bead;

      if (opts.viewMode === 'colors' || opts.viewMode === 'both') {
        ctx.fillStyle = bead.hex;
        ctx.fillRect(x, y, cell, cell);
      } else {
        // Symbol-only: white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, y, cell, cell);
      }

      if ((opts.viewMode === 'symbols' || opts.viewMode === 'both') && cell) {
        ctx.fillStyle = opts.viewMode === 'both' ? '#FFFFFF' : bead.hex;
        ctx.font = `bold ${Math.max(8, cell * 0.55)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Shadow for readability in 'both' mode
        if (opts.viewMode === 'both') {
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = 2;
        }
        ctx.fillText(cellData.symbol, x + cell / 2, y + cell / 2);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }

      // Color code label
      if (opts.showColorCodes && cellData.bead) {
        const label = colorLabel(cellData.bead.code, cellData.symbol);
        const fontSize = Math.max(7, Math.floor(cell * 0.38));
        ctx.font = 'bold ' + fontSize + 'px "Cascadia Code", "Fira Code", "Segoe UI", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const cx = x + cell / 2;
        const cy = y + cell - Math.max(1, Math.floor(cell * 0.08));
        // Stroke outline for contrast
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = Math.max(1, cell * 0.05);
        ctx.strokeText(label, cx, cy);
        // White fill
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, cx, cy);
      }

    }
  }

  // ── Grid lines (real board style) ──
  // Layer 1: fine grid lines between every bead
  // Layer 2: every 5 beads — medium lines (counting aid)
  // Layer 3: board boundaries — thick solid lines
  // Layer 4: center crosshair
  if (opts.showGrid && cell >= 4) {
    // Fine grid: every bead
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = cell >= 16 ? 0.5 : 0.3;
    ctx.beginPath();
    for (let x = 0; x <= width; x++) {
      const px = coordLeft + x * cell + 0.5;
      ctx.moveTo(px, offsetY);
      ctx.lineTo(px, offsetY + gridH);
    }
    for (let y = 0; y <= height; y++) {
      const py = offsetY + y * cell + 0.5;
      ctx.moveTo(coordLeft, py);
      ctx.lineTo(coordLeft + gridW, py);
    }
    ctx.stroke();

    // Every 5 beads: thicker counting lines
    if (cell >= 10) {
      ctx.strokeStyle = 'rgba(0,0,0,0.22)';
      ctx.lineWidth = cell >= 16 ? 1.2 : 0.8;
      ctx.beginPath();
      for (let x = 5; x < width; x += 5) {
        const px = coordLeft + x * cell + 0.5;
        ctx.moveTo(px, offsetY);
        ctx.lineTo(px, offsetY + gridH);
      }
      for (let y = 5; y < height; y += 5) {
        const py = offsetY + y * cell + 0.5;
        ctx.moveTo(coordLeft, py);
        ctx.lineTo(coordLeft + gridW, py);
      }
      ctx.stroke();
    }
  }

  // Board boundary lines (thick, board-sized)
  if (opts.showBoardLines) {
    const bs = pattern.boardSize;
    const { cols, rows } = getBoardGrid(width, height, bs);

    // Draw board boundaries as solid thick lines
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.lineWidth = cell >= 16 ? 2.5 : 1.5;
    ctx.beginPath();
    for (let c = 1; c < cols; c++) {
      const x = coordLeft + c * bs * cell + 0.5;
      ctx.moveTo(x, offsetY);
      ctx.lineTo(x, offsetY + gridH);
    }
    for (let r = 1; r < rows; r++) {
      const y = offsetY + r * bs * cell + 0.5;
      ctx.moveTo(coordLeft, y);
      ctx.lineTo(coordLeft + gridW, y);
    }
    ctx.stroke();

    // Outer border
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.lineWidth = cell >= 16 ? 3 : 2;
    ctx.strokeRect(coordLeft + 0.5, offsetY + 0.5, gridW - 1, gridH - 1);

    // Center crosshair (if pattern is a single board)
    if (opts.showCenterCrosshair && width <= bs && height <= bs && cell >= 16) {
      const cx = coordLeft + (width * cell) / 2;
      const cy = offsetY + (height * cell) / 2;
      const crossLen = cell * 0.8;

      ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      // Horizontal center line
      ctx.moveTo(coordLeft, cy);
      ctx.lineTo(coordLeft + gridW, cy);
      // Vertical center line
      ctx.moveTo(cx, offsetY);
      ctx.lineTo(cx, offsetY + gridH);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center dot
      ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(2, cell * 0.08), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Legend
  if (opts.showLegend && materials.length > 0) {
    const legendY = offsetY + gridH + 16;

    // Legend header
    ctx.fillStyle = '#18202e';
    ctx.font = 'bold 13px "Inter", "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(
      t('bead.renderLegend', { colors: materials.length, beads: pattern.totalBeads }),
      coordLeft,
      legendY
    );

    const itemStartY = legendY + 24;
    const colWidth = Math.max(180, gridW / legendCols);

    materials.forEach((item, i) => {
      const col = i % legendCols;
      const row = Math.floor(i / legendCols);
      const ix = coordLeft + col * colWidth;
      const iy = itemStartY + row * legendItemH;

      // Color swatch
      ctx.fillStyle = item.bead.hex;
      ctx.beginPath();
      ctx.roundRect(ix, iy + 3, 14, 14, 3);
      ctx.fill();
      ctx.strokeStyle = '#D0D0D0';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Symbol
      ctx.fillStyle = '#5d6b81';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.symbol, ix + 18, iy + 10);

      // Code + name + count
      ctx.fillStyle = '#18202e';
      ctx.font = '11px "Inter", "Segoe UI", sans-serif';
      ctx.fillText(
        `${item.bead.code} ${item.bead.name}`,
        ix + 32,
        iy + 10
      );

      // Count
      ctx.fillStyle = '#5d6b81';
      ctx.font = '11px "Cascadia Code", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(
        `${item.count} (${item.percentage.toFixed(1)}%)`,
        ix + colWidth - 8,
        iy + 10
      );
      ctx.textAlign = 'left';
    });
  }

  return canvas;
}
