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
  variables: (id: string) => `/api/collections/${encodeURIComponent(id)}/variables`,
  workflows: (id: string) => `/api/collections/${encodeURIComponent(id)}/workflows`,
  folders: (id: string, folderId: string) => `/api/collections/${encodeURIComponent(id)}/folders/${encodeURIComponent(folderId)}`,
};

export const requestUrls = {
  list: (collectionId: string) => `/api/collections/${encodeURIComponent(collectionId)}/requests`,
  get: (collectionId: string, requestId: string) =>
    `/api/collections/${encodeURIComponent(collectionId)}/requests/${encodeURIComponent(requestId)}`,
  create: (collectionId: string) => `/api/collections/${encodeURIComponent(collectionId)}/requests`,
  update: (collectionId: string, requestId: string) =>
    `/api/collections/${encodeURIComponent(collectionId)}/requests/${encodeURIComponent(requestId)}`,
  delete: (collectionId: string, requestId: string) =>
    `/api/collections/${encodeURIComponent(collectionId)}/requests/${encodeURIComponent(requestId)}`,
};

export const fileUrls = {
  upload: '/api/files/upload',
  get: (id: string) => `/api/files/${encodeURIComponent(id)}`,
  delete: (id: string) => `/api/files/${encodeURIComponent(id)}`,
};
