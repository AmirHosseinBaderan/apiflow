import { describe, expect, it, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useCollectionStore } from '@stores/useCollectionStore';
import { CollectionService } from '@application/collections/CollectionService';

class MemoryRepo {
  data: Map<string, unknown> = new Map();
  async list() { return Array.from(this.data.values()) as never; }
  async get(id: string) { return this.data.get(id) as never; }
  async save(c: unknown) { this.data.set((c as { id: string }).id, c); }
  async remove(id: string) { this.data.delete(id); }
}

describe('useCollectionStore', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('creates and selects collection', async () => {
    const store = useCollectionStore();
    store.bindService(new CollectionService(new MemoryRepo() as never));
    await store.refresh();
    await store.createCollection('Sample');
    expect(store.collections).toHaveLength(1);
    expect(store.activeCollectionId).toBe(store.collections[0]!.id);
  });

  it('creates a request and tracks active id', async () => {
    const store = useCollectionStore();
    store.bindService(new CollectionService(new MemoryRepo() as never));
    await store.refresh();
    await store.createCollection('Sample');
    await store.createRequest('Hello');
    expect(store.activeRequest?.name).toBe('Hello');
  });
});