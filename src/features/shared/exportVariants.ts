export type ExportFormat = 'c' | 'h' | 'txt' | 'md' | 'py' | 'json';

export interface ExportPayload {
  /** C identifier base, e.g. `img_128x64` */
  name: string;
  /** Canonical C source (what the code drawer shows) */
  source: string;
  /** Flat byte data for single-frame tools */
  bytes?: number[];
  /** Per-frame byte data for multi-frame tools */
  frames?: number[][];
  width: number;
  height: number;
  /** Extra scalar/array metadata, e.g. { fps: 10, delays: [...] } */
  extra?: Record<string, number | number[] | string>;
}

export interface ExportResult {
  content: string;
  ext: string;
  mime: string;
}

function toPyLiteral(value: number | number[] | string): string {
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.join(', ')}]`;
  return String(value);
}

function chunkRows(bytes: number[], perRow = 16): string[] {
  const rows: string[] = [];
  for (let i = 0; i < bytes.length; i += perRow) {
    rows.push(bytes.slice(i, i + perRow).join(', '));
  }
  return rows;
}

/**
 * Convert a tool's canonical output into the requested export format.
 * Every tool page routes its bottom-bar export buttons through here so that
 * `.py` really is Python, `.json` really is JSON, etc.
 */
export function buildExport(format: ExportFormat | string, p: ExportPayload): ExportResult {
  switch (format) {
    case 'md':
      return {
        content: `# ${p.name}\n\n- Size: ${p.width}×${p.height}\n${p.frames ? `- Frames: ${p.frames.length}\n` : ''}\n\`\`\`c\n${p.source}\n\`\`\`\n`,
        ext: 'md',
        mime: 'text/markdown;charset=utf-8'
      };
    case 'py': {
      const lines: string[] = [`# ${p.name} (${p.width}x${p.height})`, `WIDTH = ${p.width}`, `HEIGHT = ${p.height}`];
      for (const [key, value] of Object.entries(p.extra ?? {})) {
        lines.push(`${key.toUpperCase()} = ${toPyLiteral(value)}`);
      }
      if (p.frames) {
        lines.push(`${p.name} = [`);
        for (const frame of p.frames) {
          lines.push(`    [${frame.join(', ')}],`);
        }
        lines.push(']');
      } else {
        lines.push(`${p.name} = [`);
        for (const row of chunkRows(p.bytes ?? [])) {
          lines.push(`    ${row},`);
        }
        lines.push(']');
      }
      return { content: lines.join('\n') + '\n', ext: 'py', mime: 'text/x-python;charset=utf-8' };
    }
    case 'json':
      return {
        content: JSON.stringify(
          {
            name: p.name,
            width: p.width,
            height: p.height,
            ...(p.extra ?? {}),
            ...(p.frames ? { frames: p.frames } : { data: p.bytes ?? [] })
          },
          null,
          2
        ),
        ext: 'json',
        mime: 'application/json;charset=utf-8'
      };
    case 'txt':
      return { content: p.source, ext: 'txt', mime: 'text/plain;charset=utf-8' };
    case 'c':
    case 'h':
    default:
      return { content: p.source, ext: 'h', mime: 'text/plain;charset=utf-8' };
  }
}

/** Trigger a browser download for an export result. */
export function downloadExport(baseName: string, result: ExportResult): void {
  const blob = new Blob([result.content], { type: result.mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${baseName}.${result.ext}`;
  a.click();
  URL.revokeObjectURL(url);
}
