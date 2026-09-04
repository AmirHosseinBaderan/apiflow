import { createApiInstance, request } from '../index';
import { authUrls } from '../urls';

const api = createApiInstance();

export interface CheckResponse {
  setupComplete: boolean;
  multiUser: boolean;
  forceLogin: boolean;
  appName: string;
}

export interface SetupRequest {
  username: string;
  password: string;
  multiUser?: boolean;
  forceLogin?: boolean;
  appName?: string;
  defaultTheme?: string;
  defaultLocale?: string;
}

export interface SetupResponse {
  token: string;
  user: { username: string; role: 'admin' | 'user' };
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: { username: string; role: 'admin' | 'user' };
}

export interface UpdateProfileRequest {
  username?: string;
  password?: string;
  currentPassword?: string;
}

export interface UpdateProfileResponse {
  username: string;
  role: 'admin' | 'user';
}

export const authCheck = () => request<CheckResponse>(api, 'GET', authUrls.check);

export const authSetup = (data: SetupRequest) =>
  request<SetupResponse>(api, 'POST', authUrls.setup, data);

export const authLogin = (data: LoginRequest) =>
  request<LoginResponse>(api, 'POST', authUrls.login, data);

export const updateProfile = (data: UpdateProfileRequest) =>
  request<UpdateProfileResponse>(api, 'PUT', authUrls.profile, data);
