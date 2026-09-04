import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { ApiException } from './types/response';

const TOKEN_KEY = 'apiflow.auth.token';

const _headers = {
  'Content-Type': 'application/json',
  accept: 'application/json',
};

let instance: AxiosInstance | null = null;

export function createApiInstance(baseURL = '/'): AxiosInstance {
  if (instance) return instance;

  const config: AxiosRequestConfig = {
    baseURL,
    headers: _headers,
  };

  instance = axios.create(config);

  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

export async function request<T>(
  axiosInstance: AxiosInstance,
  method: string,
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    const response = await axiosInstance.request({
      url,
      method,
      data,
      ...config,
    });
    return response.data as T;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data as { error?: string; message?: string };
      const message = errorData.error || errorData.message || 'Request failed';
      throw new ApiException(error.response.status, 'ApiError', message);
    }
    throw error;
  }
}

export async function postForm<T>(
  axiosInstance: AxiosInstance,
  method: string,
  url: string,
  data?: unknown
): Promise<T> {
  try {
    const response = await axiosInstance.request({
      url,
      method,
      data,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data as T;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data as { error?: string; message?: string };
      const message = errorData.error || errorData.message || 'Request failed';
      throw new ApiException(error.response.status, 'ApiError', message);
    }
    throw error;
  }
}
