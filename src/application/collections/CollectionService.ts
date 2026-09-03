import { AppError, toAppError } from '@shared/errors';
import type { Collection, CollectionFolder } from '@domain/collection/Collection';
import { emptyCollection, emptyFolder } from '@domain/collection/Collection';
import type { Workflow } from '@domain/workflow/Workflow';
import type { RequestDefinition } from '@domain/request/RequestDefinition';
import { emptyRequest } from '@domain/request/RequestDefinition';
import type { CollectionRepository } from './collectionRepositoryPort';
import { collectionRepository } from './collectionRepositoryPort';

export class CollectionService {
  private readonly repo: CollectionRepository;

  constructor(repo: CollectionRepository = collectionRepository()) {
    this.repo = repo;
  }

  async list(): Promise<ReadonlyArray<Collection>> {
    try {
      return await this.repo.list();
    } catch (e) {
      throw toAppError(e, 'StorageError');
    }
  }

  async get(id: string): Promise<Collection | undefined> {
    return this.repo.get(id);
  }

  async createCollection(name: string): Promise<Collection> {
    const collection = emptyCollection(name);
    await this.repo.save(collection);
    return collection;
  }

  async renameCollection(id: string, name: string): Promise<Collection> {
    const existing = await this.require(id);
    const updated: Collection = { ...existing, name, updatedAt: new Date().toISOString() };
    await this.repo.save(updated);
    return updated;
  }

  async renameFolder(collectionId: string, folderId: string, name: string): Promise<Collection> {
    const collection = await this.require(collectionId);
    const folders = collection.folders.map((f) =>
      f.id === folderId ? { ...f, name, updatedAt: new Date().toISOString() } : f,
    );
    const updated: Collection = { ...collection, folders, updatedAt: new Date().toISOString() };
    await this.repo.save(updated);
    return updated;
  }

  async deleteCollection(id: string): Promise<void> {
    await this.repo.remove(id);
  }

  async duplicateCollection(id: string): Promise<Collection> {
    const original = await this.require(id);
    const copy: Collection = {
      ...JSON.parse(JSON.stringify(original)),
      id: original.id + '_copy',
      name: `${original.name} (copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.repo.save(copy);
    return copy;
  }

  async createFolder(
    collectionId: string,
    name: string,
    parentId: string | null = null,
  ): Promise<Collection> {
    const collection = await this.require(collectionId);
    const folder = emptyFolder(name, parentId);
    const updated: Collection = {
      ...collection,
      folders: [...collection.folders, folder],
      updatedAt: new Date().toISOString(),
    };
    await this.repo.save(updated);
    return updated;
  }

  async deleteFolder(collectionId: string, folderId: string): Promise<Collection> {
    const collection = await this.require(collectionId);
    const folder = collection.folders.find((f) => f.id === folderId);
    if (!folder) throw new AppError({ code: 'ValidationError', message: 'Folder not found' });
    const folders = collection.folders
      .filter((f) => f.id !== folderId)
      .map((f) => ({
        ...f,
        requestIds: f.requestIds.filter((rid) => !folder.requestIds.includes(rid)),
      }));
    const requests = collection.requests.filter((r) => !folder.requestIds.includes(r.id));
    const updated: Collection = {
      ...collection,
      folders,
      requests,
      updatedAt: new Date().toISOString(),
    };
    await this.repo.save(updated);
    return updated;
  }

  async createRequest(
    collectionId: string,
    name: string,
    folderId: string | null = null,
  ): Promise<{ collection: Collection; request: RequestDefinition }> {
    const collection = await this.require(collectionId);
    const request = emptyRequest(crypto.randomUUID(), name || 'New Request');
    const folders = collection.folders.map((f) =>
      f.id === folderId ? { ...f, requestIds: [...f.requestIds, request.id] } : f,
    );
    const updated: Collection = {
      ...collection,
      folders,
      requests: [...collection.requests, request],
      updatedAt: new Date().toISOString(),
    };
    await this.repo.save(updated);
    return { collection: updated, request };
  }

  async updateRequest(collectionId: string, request: RequestDefinition): Promise<Collection> {
    const collection = await this.require(collectionId);
    const requests = collection.requests.map((r) => (r.id === request.id ? request : r));
    const updated: Collection = { ...collection, requests, updatedAt: new Date().toISOString() };
    await this.repo.save(updated);
    return updated;
  }

  async deleteRequest(collectionId: string, requestId: string): Promise<Collection> {
    const collection = await this.require(collectionId);
    const requests = collection.requests.filter((r) => r.id !== requestId);
    const folders: CollectionFolder[] = collection.folders.map((f) => ({
      ...f,
      requestIds: f.requestIds.filter((id) => id !== requestId),
    }));
    const updated: Collection = {
      ...collection,
      requests,
      folders,
      updatedAt: new Date().toISOString(),
    };
    await this.repo.save(updated);
    return updated;
  }

  async moveRequestToFolder(
    collectionId: string,
    requestId: string,
    targetFolderId: string | null,
  ): Promise<Collection> {
    const collection = await this.require(collectionId);
    const folders = collection.folders.map((f) => ({
      ...f,
      requestIds: f.requestIds.filter((id) => id !== requestId),
    }));
    const next = targetFolderId
      ? folders.map((f) =>
          f.id === targetFolderId ? { ...f, requestIds: [...f.requestIds, requestId] } : f,
        )
      : folders;
    const updated: Collection = {
      ...collection,
      folders: next,
      updatedAt: new Date().toISOString(),
    };
    await this.repo.save(updated);
    return updated;
  }

  async setCollectionVariables(
    collectionId: string,
    variables: Collection['variables'],
  ): Promise<Collection> {
    const collection = await this.require(collectionId);
    const updated: Collection = { ...collection, variables, updatedAt: new Date().toISOString() };
    await this.repo.save(updated);
    return updated;
  }

  async setWorkflows(
    collectionId: string,
    workflows: ReadonlyArray<Workflow>,
  ): Promise<Collection> {
    const collection = await this.require(collectionId);
    const updated: Collection = {
      ...collection,
      workflows: [...workflows],
      updatedAt: new Date().toISOString(),
    };
    await this.repo.save(updated);
    return updated;
  }

  private async require(id: string): Promise<Collection> {
    const c = await this.repo.get(id);
    if (!c) throw new AppError({ code: 'ValidationError', message: `Collection ${id} not found` });
    return c;
  }
}
