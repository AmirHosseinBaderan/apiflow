import { defineStore } from 'pinia';
import {createUser, deleteUser, listUsers, updateUser} from "../api/calls/admin";

export interface AdminUser {
  id: string;
  username: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export const useAdminStore = defineStore('admin', {
  state: () => ({
    users: [] as AdminUser[],
    loading: false,
    error: null as string | null,
  }),
  actions: {
    async fetchUsers() {
      this.loading = true;
      this.error = null;
      try {
        this.users = await listUsers();
      } catch (e) {
        this.error = (e as Error).message;
      } finally {
        this.loading = false;
      }
    },
    async createUser(username: string, password: string, role: 'admin' | 'user') {
      try {
        await createUser({ username, password, role });
        await this.fetchUsers();
      } catch (e) {
        throw e;
      }
    },
    async updateUser(username: string, data: { password?: string; role?: string }) {
      try {
        await updateUser(username, data);
        await this.fetchUsers();
      } catch (e) {
        throw e;
      }
    },
    async deleteUser(username: string) {
      try {
        await deleteUser(username);
        await this.fetchUsers();
      } catch (e) {
        throw e;
      }
    },
  },
});
