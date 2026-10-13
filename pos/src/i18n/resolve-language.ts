import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './config';

/**
 * Resolves the active language using the following priority:
 * 1. frappe.boot.lang (Frappe site config / user preference)
 * 2. localStorage key 'ury_language'
 * 3. DEFAULT_LANGUAGE ('en')
 */
export function resolveLanguage(): string {
  // 1. Language chosen in the POS menu (stored per browser). It must win over the Frappe user
  //    language, otherwise the menu could never change it.
  let storedLang: string | null = null;
  try { storedLang = localStorage.getItem('ury_language'); } catch { /* ignore */ }
  if (storedLang && SUPPORTED_LANGUAGES[storedLang]) {
    return storedLang;
  }

  // 2. Frappe boot object (site config / user preference)
  const frappeLang: string | undefined =
    (window as any)?.frappe?.boot?.lang;
  if (frappeLang && SUPPORTED_LANGUAGES[frappeLang]) {
    return frappeLang;
  }

  return DEFAULT_LANGUAGE;
}
