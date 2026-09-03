import { createApiInstance, postForm, request } from '../index';
import { fileUrls } from '../urls';

const api = createApiInstance();

export interface FileUploadResponse {
  id: string;
  name: string;
  size: number;
  contentType: string;
}

export interface FileStats {
  id: string;
  name: string;
  size: number;
  contentType: string;
}

export const uploadFile = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return postForm<FileUploadResponse>(api, 'POST', fileUrls.upload, form);
};

export const getFile = (id: string) =>
  request<Blob>(api, 'GET', fileUrls.get(id), undefined, {
    responseType: 'blob',
  });

export const deleteFile = (id: string) =>
  request<void>(api, 'DELETE', fileUrls.delete(id));
