import { createApiInstance, request } from '../index';
import { settingsUrls } from '../urls';

const api = createApiInstance();

export interface SettingsResponse {
  setupComplete: boolean;
  multiUser: boolean;
  forceLogin: boolean;
  appName: string;
  defaultTheme: 'light' | 'dark';
  defaultLocale: 'en' | 'fa';
}

export const getSettings = () => request<SettingsResponse>(api, 'GET', settingsUrls.list);

export const updateSettings = (data: Record<string, unknown>) =>
  request<SettingsResponse>(api, 'POST', settingsUrls.update, data);
