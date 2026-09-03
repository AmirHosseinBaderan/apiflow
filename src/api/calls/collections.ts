import { createApiInstance, request } from '../index';
import { collectionUrls, requestUrls } from '../urls';

const api = createApiInstance();

export interface CollectionResponse {
  id: string;
  name: string;
  description?: string;
  folders: unknown[];
  requests: Array<{
    id: string;
    name: string;
    method: string;
    url: string;
  }>;
  variables: unknown[];
  workflows: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface RequestSummary {
  id: string;
  name: string;
  method: string;
  url: string;
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

export const updateCollectionVariables = (id: string, variables: unknown[]) =>
  request<unknown[]>(api, 'PUT', collectionUrls.variables(id), variables);

export const updateCollectionWorkflows = (id: string, workflows: unknown[]) =>
  request<unknown[]>(api, 'PUT', collectionUrls.workflows(id), workflows);

export const renameFolder = (collectionId: string, folderId: string, name: string) =>
  request<unknown>(api, 'PUT', collectionUrls.folders(collectionId, folderId), { name });

export const deleteFolder = (collectionId: string, folderId: string) =>
  request<void>(api, 'DELETE', collectionUrls.folders(collectionId, folderId));

export interface FullRequestResponse {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: unknown[];
  queryParams: unknown[];
  pathParams: unknown[];
  body: unknown;
  auth: unknown;
  timeoutMs: number;
  retry: unknown;
  preRequest: unknown[];
  postRequest: unknown[];
  variableExtractions: unknown[];
}

export const getRequest = (collectionId: string, requestId: string) =>
  request<FullRequestResponse>(api, 'GET', requestUrls.get(collectionId, requestId));

export const createRequest = (collectionId: string, data: Record<string, unknown>) =>
  request<FullRequestResponse>(api, 'POST', requestUrls.create(collectionId), data);

export const updateRequest = (collectionId: string, requestId: string, data: Record<string, unknown>) =>
  request<FullRequestResponse>(api, 'PUT', requestUrls.update(collectionId, requestId), data);

export const deleteRequest = (collectionId: string, requestId: string) =>
  request<void>(api, 'DELETE', requestUrls.delete(collectionId, requestId));
