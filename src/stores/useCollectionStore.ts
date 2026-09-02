import { defineStore } from 'pinia';
import type { Collection } from '@domain/collection/Collection';
import type { RequestDefinition } from '@domain/request/RequestDefinition';
import type { VariableEntry } from '@domain/variable/VariableScope';
import { CollectionService } from '@application/collections/CollectionService';
import { createId } from '@shared/id';

export interface CollectionTreeNode {
  readonly kind: 'collection' | 'folder' | 'request';
  readonly id: string;
  readonly name: string;
  readonly parentId: string | null;
  readonly children: CollectionTreeNode[];
}

function buildCollectionChildren(c: Collection): CollectionTreeNode[] {
  const folderNodes = new Map<string, CollectionTreeNode>();
  for (const f of c.folders)
    folderNodes.set(f.id, { kind: 'folder', id: f.id, name: f.name, parentId: f.parentId, children: [] });
  const roots: CollectionTreeNode[] = [];
  for (const f of c.folders) {
    const node = folderNodes.get(f.id)!;
    if (f.parentId && folderNodes.has(f.parentId)) {
      folderNodes.get(f.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  for (const node of folderNodes.values()) {
    for (const rid of c.folders.find((f) => f.id === node.id)?.requestIds ?? []) {
      const req = c.requests.find((r) => r.id === rid);
      if (req) node.children.push({ kind: 'request', id: req.id, name: req.name, parentId: node.id, children: [] });
    }
  }
  const unfiledRequests = c.requests.filter((r) => !c.folders.some((f) => f.requestIds.includes(r.id)));
  for (const r of unfiledRequests) {
    roots.push({ kind: 'request', id: r.id, name: r.name, parentId: c.id, children: [] });
  }
  return roots;
}

export const useCollectionStore = defineStore('collections', {
  state: () => ({
    collections: [] as Collection[],
    activeCollectionId: null as string | null,
    activeRequestId: null as string | null,
    loading: false,
    error: null as string | null,
    service: null as CollectionService | null,
  }),

  getters: {
    activeCollection(state): Collection | null {
      return state.collections.find((c) => c.id === state.activeCollectionId) ?? null;
    },
    activeRequest(): RequestDefinition | null {
      const c = this.activeCollection;
      if (!c || !this.activeRequestId) return null;
      return c.requests.find((r) => r.id === this.activeRequestId) ?? null;
    },
    requestById(state) {
      return (id: string): RequestDefinition | null => {
        for (const c of state.collections) {
          const r = c.requests.find((rr) => rr.id === id);
          if (r) return r;
        }
        return null;
      };
    },
    treeForActive(): CollectionTreeNode[] {
      const c = this.activeCollection;
      if (!c) return [];
      return buildCollectionChildren(c);
    },
    tree(): CollectionTreeNode[] {
      return this.collections.map(
        (c) => ({ kind: 'collection', id: c.id, name: c.name, parentId: null, children: buildCollectionChildren(c) } as CollectionTreeNode),
      );
    },
  },

  actions: {
    bindService(service: CollectionService) {
      this.service = service;
    },
    async refresh() {
      if (!this.service) return;
      this.loading = true;
      this.error = null;
      try {
        this.collections = (await this.service.list()).map((c) => c);
      } catch (e) {
        this.error = (e as Error).message;
      } finally {
        this.loading = false;
      }
    },
    async createCollection(name: string) {
      if (!this.service) return;
      const c = await this.service.createCollection(name);
      this.collections = [...this.collections, c];
      this.activeCollectionId = c.id;
    },
    async renameCollection(id: string, name: string) {
      if (!this.service) return;
      const updated = await this.service.renameCollection(id, name);
      this.collections = this.collections.map((c) => (c.id === id ? updated : c));
    },
    async deleteCollection(id: string) {
      if (!this.service) return;
      await this.service.deleteCollection(id);
      this.collections = this.collections.filter((c) => c.id !== id);
      if (this.activeCollectionId === id) this.activeCollectionId = this.collections[0]?.id ?? null;
    },
    async duplicateCollection(id: string) {
      if (!this.service) return;
      const copy = await this.service.duplicateCollection(id);
      this.collections = [...this.collections, copy];
    },
    async createFolder(name: string, parentId: string | null = null) {
      if (!this.service || !this.activeCollectionId) return;
      const updated = await this.service.createFolder(this.activeCollectionId, name, parentId);
      this.replaceCollection(updated);
    },
    async deleteFolder(folderId: string) {
      if (!this.service || !this.activeCollectionId) return;
      const updated = await this.service.deleteFolder(this.activeCollectionId, folderId);
      this.replaceCollection(updated);
    },
    async createRequest(name: string, folderId: string | null = null) {
      if (!this.service || !this.activeCollectionId) return null;
      const { collection, request } = await this.service.createRequest(this.activeCollectionId, name, folderId);
      this.replaceCollection(collection);
      this.activeRequestId = request.id;
      return request;
    },
    async updateRequest(request: RequestDefinition) {
      if (!this.service || !this.activeCollectionId) return;
      const updated = await this.service.updateRequest(this.activeCollectionId, request);
      this.replaceCollection(updated);
    },
    async deleteRequest(requestId: string) {
      if (!this.service || !this.activeCollectionId) return;
      const updated = await this.service.deleteRequest(this.activeCollectionId, requestId);
      this.replaceCollection(updated);
      if (this.activeRequestId === requestId) this.activeRequestId = null;
    },
    async setCollectionVariables(variables: VariableEntry[]) {
      if (!this.service || !this.activeCollectionId) return;
      const updated = await this.service.setCollectionVariables(this.activeCollectionId, variables);
      this.replaceCollection(updated);
    },
    selectCollection(id: string) {
      this.activeCollectionId = id;
      this.activeRequestId = null;
    },
    selectRequest(id: string) {
      this.activeRequestId = id;
    },
    replaceCollection(updated: Collection) {
      this.collections = this.collections.map((c) => (c.id === updated.id ? updated : c));
    },
  },
});

export function newRequestId(): string {
  return createId('req');
}