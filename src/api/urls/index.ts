export const baseURL = '/';

export const authUrls = {
  check: '/api/auth/check',
  setup: '/api/auth/setup',
  login: '/api/auth/login',
};

export const settingsUrls = {
  list: '/api/settings',
  update: '/api/settings',
};

export const adminUrls = {
  users: '/api/admin/users',
  user: (username: string) => `/api/admin/users/${encodeURIComponent(username)}`,
};

export const collectionUrls = {
  list: '/api/collections',
  get: (id: string) => `/api/collections/${encodeURIComponent(id)}`,
  create: '/api/collections',
  update: (id: string) => `/api/collections/${encodeURIComponent(id)}`,
  delete: (id: string) => `/api/collections/${encodeURIComponent(id)}`,
};

export const fileUrls = {
  upload: '/api/files/upload',
  get: (id: string) => `/api/files/${encodeURIComponent(id)}`,
  delete: (id: string) => `/api/files/${encodeURIComponent(id)}`,
};
