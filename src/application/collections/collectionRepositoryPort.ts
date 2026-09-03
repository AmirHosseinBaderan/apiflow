import type { Collection } from '@domain/collection/Collection';
import type { RequestDefinition } from '@domain/request/RequestDefinition';

export interface CollectionRepository {
  list(): Promise<ReadonlyArray<Collection>>;
  get(id: string): Promise<Collection | undefined>;
  save(collection: Collection): Promise<void>;
  remove(id: string): Promise<void>;
  getRequest(collectionId: string, requestId: string): Promise<RequestDefinition | undefined>;
  saveRequest(collectionId: string, request: RequestDefinition): Promise<void>;
  deleteRequest(collectionId: string, requestId: string): Promise<void>;
  updateVariables(collectionId: string, variables: Collection['variables']): Promise<void>;
  updateWorkflows(collectionId: string, workflows: Collection['workflows']): Promise<void>;
}

let active: CollectionRepository | undefined;

export function setCollectionRepository(repo: CollectionRepository): void {
  active = repo;
}

export function collectionRepository(): CollectionRepository {
  if (!active) {
    throw new Error('CollectionRepository not configured. Call setCollectionRepository() at bootstrap.');
  }
  return active;
}