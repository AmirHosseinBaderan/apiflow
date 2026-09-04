import { defineStore } from 'pinia';
import type { Locale } from '@i18n/store';
import { getSettings as getSettingsApi, updateSettings as updateSettingsApi } from '../api/calls/settings';
import type { SettingsResponse } from '../api/calls/settings';

const STORAGE_KEY = 'app_theme';

export type AppTheme = 'light' | 'dark';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    theme:
      (typeof localStorage !== 'undefined' &&
        (localStorage.getItem(STORAGE_KEY) as AppTheme | null)) ||
      'dark',
    locale:
      (typeof localStorage !== 'undefined' &&
        (localStorage.getItem('app_locale') as Locale | null)) ||
      'en',
    serverSettings: null as SettingsResponse | null,
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
    async fetch() {
      this.serverSettings = await getSettingsApi();
      if (this.serverSettings?.defaultTheme) this.setTheme(this.serverSettings.defaultTheme);
      if (this.serverSettings?.defaultLocale) this.setLocale(this.serverSettings.defaultLocale);
      return this.serverSettings;
    },
    async save(data: { appName?: string; multiUser?: boolean; forceLogin?: boolean; defaultTheme?: string; defaultLocale?: string }) {
      const updated = await updateSettingsApi(data);
      this.serverSettings = updated;
      if (updated.defaultTheme) this.setTheme(updated.defaultTheme);
      if (updated.defaultLocale) this.setLocale(updated.defaultLocale);
      return updated;
    },
  },
});
