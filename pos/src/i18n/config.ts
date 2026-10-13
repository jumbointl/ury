export const DEFAULT_LANGUAGE = 'en';

export const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
  'pt-BR': 'Português (Brasil)',
  'zh-TW': '中文（繁體）',
  zh: '中文（简体）',
  'zh-CN': '中文（简体）',
  fr: 'Français',
  ar: 'العربية',
};

/** Languages offered in the POS language menu (aliases such as pt-BR / zh-CN resolve to the same files). */
export const LANGUAGE_MENU: Array<{ code: string; label: string }> = [
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'zh-TW', label: '中文（繁體）' },
  { code: 'zh', label: '中文（简体）' },
  { code: 'en', label: 'English' },
];
