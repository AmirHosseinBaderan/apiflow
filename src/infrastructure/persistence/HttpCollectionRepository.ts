import { AppError } from '@shared/errors';
import type { Collection } from '@domain/collection/Collection';
import type { CollectionRepository } from '@application/collections/collectionRepositoryPort';
import type { RequestDefinition } from '@domain/request/RequestDefinition';
import { createApiInstance, request as apiRequest } from '../../api';
import { collectionUrls, requestUrls } from '../../api/urls';

const api = createApiInstance();

export class HttpCollectionRepository implements CollectionRepository {
  async list(): Promise<ReadonlyArray<Collection>> {
    try {
      return await apiRequest<Collection[]>(api, 'GET', collectionUrls.list);
    } catch (e) {
      throw new AppError({ code: 'NetworkError', message: 'Failed to load collections', cause: e });
    }
  }

  async get(id: string): Promise<Collection | undefined> {
    try {
      return await apiRequest<Collection>(api, 'GET', collectionUrls.get(id));
    } catch (e) {
      if ((e as { status?: number }).status === 404) return undefined;
      throw new AppError({ code: 'NetworkError', message: 'Failed to load collection', cause: e });
    }
  }

  async save(collection: Collection): Promise<void> {
    try {
      await apiRequest(api, 'POST', collectionUrls.create, collection);
    } catch (e) {
      throw new AppError({ code: 'StorageError', message: 'Failed to save collection', cause: e });
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await apiRequest(api, 'DELETE', collectionUrls.delete(id));
    } catch (e) {
      throw new AppError({ code: 'StorageError', message: 'Failed to delete collection', cause: e });
    }
  }

  async getRequest(collectionId: string, requestId: string): Promise<RequestDefinition | undefined> {
    try {
      return await apiRequest<RequestDefinition>(api, 'GET', requestUrls.get(collectionId, requestId));
    } catch (e) {
      if ((e as { status?: number }).status === 404) return undefined;
      throw new AppError({ code: 'NetworkError', message: 'Failed to load request', cause: e });
    }
  }

  async saveRequest(collectionId: string, request: RequestDefinition): Promise<void> {
    try {
      await apiRequest(api, 'PUT', requestUrls.update(collectionId, request.id), request);
    } catch (e) {
      throw new AppError({ code: 'StorageError', message: 'Failed to save request', cause: e });
    }
  }

  async deleteRequest(collectionId: string, requestId: string): Promise<void> {
    try {
      await apiRequest(api, 'DELETE', requestUrls.delete(collectionId, requestId));
    } catch (e) {
      throw new AppError({ code: 'StorageError', message: 'Failed to delete request', cause: e });
    }
  }

  async updateVariables(collectionId: string, variables: Collection['variables']): Promise<void> {
    try {
      await apiRequest(api, 'PUT', collectionUrls.variables(collectionId), variables);
    } catch (e) {
      throw new AppError({ code: 'StorageError', message: 'Failed to save variables', cause: e });
    }
  }

  async updateWorkflows(collectionId: string, workflows: Collection['workflows']): Promise<void> {
    try {
      await apiRequest(api, 'PUT', collectionUrls.workflows(collectionId), workflows);
    } catch (e) {
      throw new AppError({ code: 'StorageError', message: 'Failed to save workflows', cause: e });
    }
  }
}
