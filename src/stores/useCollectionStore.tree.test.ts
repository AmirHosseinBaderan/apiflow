import { describe, expect, it, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useCollectionStore } from '@stores/useCollectionStore';
import { CollectionService } from '@application/collections/CollectionService';

class MemoryRepo {
  data: Map<string, { id: string; name: string; folders: { id: string; name: string; parentId: string | null; requestIds: string[]; childFolderIds: string[] }[]; requests: { id: string; name: string }[] }> = new Map();
  async list() { return Array.from(this.data.values()) as never; }
  async get(id: string) { return this.data.get(id) as never; }
  async save(_c: { id: string }) { /* not used */ }
  async remove(_id: string) { /* not used */ }
}

describe('treeForActive with OpenAPI-style data', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('shows folders and nested requests', async () => {
    const store = useCollectionStore();
    const repo = new MemoryRepo();
    const folderId = 'f1';
    const reqId = 'r1';
    repo.data.set('c1', {
      id: 'c1',
      name: 'Demo',
      folders: [{ id: folderId, name: 'Users', parentId: null, requestIds: [reqId], childFolderIds: [] }],
      requests: [{ id: reqId, name: 'Get User' }],
    });
    store.bindService(new CollectionService(repo as never));
    await store.refresh();
    store.selectCollection('c1');
    const tree = store.treeForActive;
    expect(tree).toHaveLength(1);
    expect(tree[0]?.kind).toBe('folder');
    expect(tree[0]?.name).toBe('Users');
    expect(tree[0]?.children).toHaveLength(1);
    expect(tree[0]?.children[0]?.kind).toBe('request');
  });
});
