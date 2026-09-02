import type { Collection } from '@domain/collection/Collection';

export interface CollectionRepository {
  list(): Promise<ReadonlyArray<Collection>>;
  get(id: string): Promise<Collection | undefined>;
  save(collection: Collection): Promise<void>;
  remove(id: string): Promise<void>;
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