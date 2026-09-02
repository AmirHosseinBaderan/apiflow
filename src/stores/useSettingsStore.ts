import { defineStore } from 'pinia';
import type { Locale } from '@i18n/store';

const STORAGE_KEY = 'app_theme';

export type AppTheme = 'light' | 'dark';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    theme: (typeof localStorage !== 'undefined' && (localStorage.getItem(STORAGE_KEY) as AppTheme | null)) ||
      'dark',
    locale: (typeof localStorage !== 'undefined' && (localStorage.getItem('app_locale') as Locale | null)) || 'en',
  }),
  actions: {
    setTheme(theme: AppTheme) {
      this.theme = theme;
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, theme);
    },
    setLocale(locale: Locale) {
      this.locale = locale;
      if (typeof localStorage !== 'undefined') localStorage.setItem('app_locale', locale);
    },
  },
});
