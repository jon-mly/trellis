import { createContext, useContext } from 'react';
import type { Locale, TranslationStrings } from './types';
import { en } from './en';

const translations: Record<Locale, TranslationStrings> = {
  en,
};

const DEFAULT_LOCALE: Locale = 'en';

export function getTranslations(locale: Locale = DEFAULT_LOCALE): TranslationStrings {
  return translations[locale] ?? translations[DEFAULT_LOCALE];
}

export function detectLocale(): Locale {
  const browserLocale: string = navigator.language.split('-')[0] ?? DEFAULT_LOCALE;
  if (browserLocale in translations) {
    return browserLocale as Locale;
  }
  return DEFAULT_LOCALE;
}

const I18nContext = createContext<TranslationStrings>(translations[DEFAULT_LOCALE]);

export const I18nProvider = I18nContext.Provider;

export function useI18n(): TranslationStrings {
  return useContext(I18nContext);
}

export type { Locale, TranslationStrings };
