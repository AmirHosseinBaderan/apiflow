import { AppError } from '@shared/errors';
import type { Collection } from '@domain/collection/Collection';
import type { CollectionRepository } from '@application/collections/collectionRepositoryPort';
import {createApiInstance, request} from "../../api";
import {collectionUrls} from "../../api/urls";

const api = createApiInstance();

export class HttpCollectionRepository implements CollectionRepository {
  async list(): Promise<ReadonlyArray<Collection>> {
    try {
      return await request<Collection[]>(api, 'GET', collectionUrls.list);
    } catch (e) {
      throw new AppError({ code: 'NetworkError', message: 'Failed to load collections', cause: e });
    }
  }

  async get(id: string): Promise<Collection | undefined> {
    try {
      return await request<Collection>(api, 'GET', collectionUrls.get(id));
    } catch (e) {
      if ((e as { status?: number }).status === 404) return undefined;
      throw new AppError({ code: 'NetworkError', message: 'Failed to load collection', cause: e });
    }
  }

  async save(collection: Collection): Promise<void> {
    try {
      await request(api, 'PUT', collectionUrls.update(collection.id), collection);
    } catch (e) {
      throw new AppError({ code: 'StorageError', message: 'Failed to save collection', cause: e });
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await request(api, 'DELETE', collectionUrls.delete(id));
    } catch (e) {
      throw new AppError({ code: 'StorageError', message: 'Failed to delete collection', cause: e });
    }
  }
}
