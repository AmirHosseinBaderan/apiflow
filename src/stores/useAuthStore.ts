import { defineStore } from 'pinia';

export interface User {
  username: string;
  role: 'admin' | 'user';
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
    logout() {
      this.token = null;
      this.user = null;
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('apiflow.auth.token');
        localStorage.removeItem('apiflow.auth.user');
      }
    },
    restore() {
      if (typeof localStorage === 'undefined') return;
      const token = localStorage.getItem('apiflow.auth.token');
      const userRaw = localStorage.getItem('apiflow.auth.auth.user');
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
