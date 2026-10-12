import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import dayjs from 'dayjs'
import 'dayjs/locale/uz-latn'
import 'dayjs/locale/ru'
import 'dayjs/locale/en'
import ru from './locales/ru'
import en from './locales/en'

export const LANGUAGES = [
  { code: 'uz', label: "O'zbekcha", short: 'UZ' },
  { code: 'ru', label: 'Русский', short: 'RU' },
  { code: 'en', label: 'English', short: 'EN' },
] as const
export type LangCode = (typeof LANGUAGES)[number]['code']

const STORAGE_KEY = 'lang'

const readSaved = (): LangCode => {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'uz' || v === 'ru' || v === 'en') return v
  } catch { /* storage unavailable */ }
  return 'uz'
}

// Uzbek texts are the translation keys themselves, so `uz` needs no dictionary.
i18n.use(initReactI18next).init({
  resources: { uz: { translation: {} }, ru: { translation: ru }, en: { translation: en } },
  lng: readSaved(),
  fallbackLng: 'uz',
  keySeparator: false,
  nsSeparator: false,
  returnEmptyString: false,
  interpolation: { escapeValue: false },
  // Development aid: untranslated keys of ru / en are collected in window.__missingKeys.
  saveMissing: import.meta.env.DEV,
  missingKeyHandler: (_lngs, _ns, key) => {
    if (!import.meta.env.DEV || i18n.language === 'uz') return
    const w = window as unknown as { __missingKeys?: Set<string> }
    ;(w.__missingKeys ??= new Set()).add(key)
  },
})

export const dayjsLocale = (lng: string) => (lng === 'uz' ? 'uz-latn' : lng)

dayjs.locale(dayjsLocale(i18n.language))

i18n.on('languageChanged', (lng) => {
  dayjs.locale(dayjsLocale(lng))
  document.documentElement.lang = lng
  try { localStorage.setItem(STORAGE_KEY, lng) } catch { /* ignore */ }
})
document.documentElement.lang = i18n.language

export default i18n
