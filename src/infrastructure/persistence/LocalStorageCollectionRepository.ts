import { AppError } from '@shared/errors';
import type { Collection } from '@domain/collection/Collection';
import type { CollectionRepository } from '@application/collections/collectionRepositoryPort';

const STORAGE_KEY = 'apiflow.collections.v1';

export class LocalStorageCollectionRepository implements CollectionRepository {
  async list(): Promise<ReadonlyArray<Collection>> {
    return this.readAll();
  }

  async get(id: string): Promise<Collection | undefined> {
    const all = this.readAll();
    return all.find((c) => c.id === id);
  }

  async save(collection: Collection): Promise<void> {
    const all = this.readAll();
    const idx = all.findIndex((c) => c.id === collection.id);
    const updated = collection.updatedAt === all[idx]?.updatedAt ? collection : { ...collection };
    const next = idx >= 0 ? all.map((c, i) => (i === idx ? updated : c)) : [...all, updated];
    this.writeAll(next);
  }

  async remove(id: string): Promise<void> {
    const all = this.readAll().filter((c) => c.id !== id);
    this.writeAll(all);
  }

  private readAll(): ReadonlyArray<Collection> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed as Collection[];
    } catch (e) {
      throw new AppError({
        code: 'StorageError',
        message: 'Failed to read collections from storage',
        cause: e,
      });
    }
  }

  private writeAll(items: ReadonlyArray<Collection>): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      throw new AppError({
        code: 'StorageError',
        message: 'Failed to persist collections',
        cause: e,
      });
    }
  }
}