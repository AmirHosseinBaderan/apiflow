import { defineStore } from 'pinia';
import en from './messages/en';
import fa from './messages/fa';
import type { Locale } from '@i18n/store';

export type Locale = 'en' | 'fa';

const STORAGE_KEY = 'app_locale';
const messages: Record<string, Record<string, string>> = { en, fa };

export function localeMessages(locale: string): Record<string, string> {
  return messages[locale] ?? messages.en;
}

export const useLocaleStore = defineStore('locale', {
  state: () => ({
    locale: (typeof localStorage !== 'undefined' && (localStorage.getItem(STORAGE_KEY) as Locale | null)) || 'en',
  }),
  actions: {
    setLocale(locale: Locale) {
      this.locale = locale;
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, locale);
    },
    t(key: string): string {
      return localeMessages(this.locale)[key] ?? localeMessages('en')[key] ?? key;
    },
  },
});
