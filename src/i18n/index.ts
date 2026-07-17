import { ref } from 'vue';
import { messages, type Locale, type MessageKey } from './messages';

const STORAGE_KEY = 'dms-locale';

function initialLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'zh' || saved === 'en') return saved;
  } catch { /* storage unavailable */ }
  return navigator.language?.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

/** Current UI locale — reactive, shared app-wide. */
export const locale = ref<Locale>(initialLocale());

export function setLocale(next: Locale) {
  locale.value = next;
  document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch { /* storage unavailable */ }
}

export function toggleLocale() {
  setLocale(locale.value === 'zh' ? 'en' : 'zh');
}

/**
 * Translate a message key, with optional `{name}` interpolation:
 *   t('video.gallery', { n: 12 }) → 'Frame Gallery (12)'
 * Reads `locale.value`, so templates and computeds re-render on switch.
 */
export function t(key: MessageKey, params?: Record<string, string | number>): string {
  let text: string = messages[locale.value][key] ?? messages.en[key] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

// Reflect the initial locale in <html lang> on module load.
document.documentElement.lang = locale.value === 'zh' ? 'zh-CN' : 'en';
