import {getSettings, SettingsResponse} from "../api/calls/settings";

type Settings = SettingsResponse | null;

class SettingsMiddleware {
  private cached: Settings = null;
  private loading = false;
  private initialized = false;

  get settings(): Settings {
    return this.cached;
  }

  get defaultTheme(): 'light' | 'dark' {
    return this.cached?.defaultTheme ?? 'dark';
  }

  get defaultLocale(): 'en' | 'fa' {
    return this.cached?.defaultLocale ?? 'en';
  }

  get appName(): string {
    return this.cached?.appName ?? 'API Flow';
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    await this.refresh();
    this.initialized = true;
  }

  async refresh(): Promise<Settings> {
    if (this.loading) return this.cached;
    this.loading = true;
    try {
      const data = await getSettings();
      this.cached = data;
      return data;
    } catch {
      return this.cached;
    } finally {
      this.loading = false;
    }
  }

  invalidate(): void {
    this.cached = null;
    this.initialized = false;
  }
}

export const settingsMiddleware = new SettingsMiddleware();
