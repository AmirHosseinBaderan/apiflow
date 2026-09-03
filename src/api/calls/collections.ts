import { createApiInstance, request } from '../index';
import { collectionUrls } from '../urls';

const api = createApiInstance();

export interface CollectionResponse {
  id: string;
  name: string;
  description?: string;
  folders: unknown[];
  requests: unknown[];
  variables: unknown[];
  workflows: unknown[];
  createdAt: string;
  updatedAt: string;
}

export const listCollections = () => request<CollectionResponse[]>(api, 'GET', collectionUrls.list);

export const getCollection = (id: string) =>
  request<CollectionResponse>(api, 'GET', collectionUrls.get(id));

export const createCollection = (data: Record<string, unknown>) =>
  request<CollectionResponse>(api, 'POST', collectionUrls.create, data);

export const updateCollection = (id: string, data: Record<string, unknown>) =>
  request<CollectionResponse>(api, 'PUT', collectionUrls.update(id), data);

export const deleteCollection = (id: string) =>
  request<void>(api, 'DELETE', collectionUrls.delete(id));
