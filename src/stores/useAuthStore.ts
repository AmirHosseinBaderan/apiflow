import { defineStore } from 'pinia';
import {authMiddleware} from "../middleware/authMiddleware";
import { updateProfile as updateProfileApi } from "../api/calls/auth";
import { authLogin as authLoginApi, authSetup as authSetupApi } from "../api/calls/auth";

export interface User {
  username: string;
  role: 'admin' | 'user';
}

export interface UpdateProfileData {
  username?: string;
  password?: string;
  currentPassword?: string;
}

export interface SetupData {
  appName?: string;
  defaultTheme?: string;
  defaultLocale?: string;
  multiUser?: boolean;
  forceLogin?: boolean;
  username?: string;
  password?: string;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null as string | null,
    user: null as User | null,
    initialized: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    isAdmin: (state) => state.user?.role === 'admin',
  },
  actions: {
    setAuth(token: string, user: User) {
      this.token = token;
      this.user = user;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('apiflow.auth.token', token);
        localStorage.setItem('apiflow.auth.user', JSON.stringify(user));
      }
    },
    async login(username: string, password: string) {
      const data = await authLoginApi({ username, password });
      this.setAuth(data.token, data.user);
      authMiddleware.invalidate();
      return data;
    },
    async setup(data: SetupData) {
      const result = await authSetupApi(data as Parameters<typeof authSetupApi>[0]);
      this.setAuth(result.token, result.user);
      authMiddleware.invalidate();
      return result;
    },
    async updateProfile(data: UpdateProfileData) {
      const updated = await updateProfileApi(data);
      this.user = updated;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('apiflow.auth.user', JSON.stringify(updated));
      }
      return updated;
    },
    logout() {
      this.token = null;
      this.user = null;
      authMiddleware.invalidate();
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('apiflow.auth.token');
        localStorage.removeItem('apiflow.auth.user');
      }
    },
    restore() {
      if (typeof localStorage === 'undefined') return;
      const token = localStorage.getItem('apiflow.auth.token');
      const userRaw = localStorage.getItem('apiflow.auth.user');
      if (token && userRaw) {
        try {
          this.token = token;
          this.user = JSON.parse(userRaw);
        } catch {
          this.token = null;
          this.user = null;
        }
      }
      this.initialized = true;
    },
  },
});
