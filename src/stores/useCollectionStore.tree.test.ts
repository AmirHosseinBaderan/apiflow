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

describe('tree with OpenAPI-style data', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('nests collections -> folders -> requests, plus unfiled requests', async () => {
    const store = useCollectionStore();
    const repo = new MemoryRepo();
    const folderId = 'f1';
    const reqId = 'r1';
    const unfiledId = 'r2';
    repo.data.set('c1', {
      id: 'c1',
      name: 'Demo',
      folders: [{ id: folderId, name: 'Users', parentId: null, requestIds: [reqId], childFolderIds: [] }],
      requests: [{ id: reqId, name: 'Get User' }, { id: unfiledId, name: 'Unfiled' }],
    });
    store.bindService(new CollectionService(repo as never));
    await store.refresh();
    const tree = store.tree;
    expect(tree).toHaveLength(1);
    const col = tree[0]!;
    expect(col.kind).toBe('collection');
    expect(col.id).toBe('c1');
    expect(col.children).toHaveLength(2);
    expect(col.children[0]?.kind).toBe('folder');
    expect(col.children[0]?.children[0]?.kind).toBe('request');
    expect(col.children[1]?.kind).toBe('request');
  });
});
