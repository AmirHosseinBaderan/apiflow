import { createApiInstance, request } from '../index';
import { adminUrls } from '../urls';

const api = createApiInstance();

export interface AdminUserResponse {
  id: string;
  username: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export const listUsers = () => request<AdminUserResponse[]>(api, 'GET', adminUrls.users);

export const createUser = (data: { username: string; password: string; role: string }) =>
  request<AdminUserResponse>(api, 'POST', adminUrls.users, data);

export const updateUser = (username: string, data: { password?: string; role?: string }) =>
  request<AdminUserResponse>(api, 'PUT', adminUrls.user(username), data);

export const deleteUser = (username: string) =>
  request<void>(api, 'DELETE', adminUrls.user(username));
