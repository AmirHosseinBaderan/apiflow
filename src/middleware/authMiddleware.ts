import { authCheck } from '../api/calls/auth';
import type { CheckResponse } from '../api/calls/auth';

type AuthStatus = CheckResponse | null;

class AuthMiddleware {
  private cached: AuthStatus = null;
  private loading = false;
  private initialized = false;

  get status(): AuthStatus {
    return this.cached;
  }

  get isSetupComplete(): boolean {
    return this.cached?.setupComplete ?? false;
  }

  get isMultiUser(): boolean {
    return this.cached?.multiUser ?? false;
  }

  get forceLogin(): boolean {
    return this.cached?.forceLogin ?? false;
  }

  get appName(): string {
    return this.cached?.appName ?? 'API Flow';
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    await this.refresh();
    this.initialized = true;
  }

  async refresh(): Promise<AuthStatus> {
    if (this.loading) return this.cached;
    this.loading = true;
    try {
      const data = await authCheck();
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

export const authMiddleware = new AuthMiddleware();
