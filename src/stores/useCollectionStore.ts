import { defineStore } from 'pinia';
import type { Collection } from '@domain/collection/Collection';
import type { RequestDefinition } from '@domain/request/RequestDefinition';
import type { VariableEntry } from '@domain/variable/VariableScope';
import type { Workflow } from '@domain/workflow/Workflow';
import { CollectionService } from '@application/collections/CollectionService';
import { createId } from '@shared/id';

export interface CollectionTreeNode {
  readonly kind: 'collection' | 'folder' | 'request';
  readonly id: string;
  readonly name: string;
  readonly parentId: string | null;
  readonly children: CollectionTreeNode[];
  readonly isAction?: boolean;
}

const UNSORTED_KEY = 'apiflow.unsorted.v1';
const ACTIVE_STATE_KEY = 'apiflow.activeState';

function loadActiveState(): { collectionId: string | null; requestId: string | null } {
  try {
    const raw = localStorage.getItem(ACTIVE_STATE_KEY);
    if (!raw) return { collectionId: null, requestId: null };
    return JSON.parse(raw) as { collectionId: string | null; requestId: string | null };
  } catch {
    return { collectionId: null, requestId: null };
  }
}

function persistActiveState(collectionId: string | null, requestId: string | null) {
  try {
    localStorage.setItem(ACTIVE_STATE_KEY, JSON.stringify({ collectionId, requestId }));
  } catch {
    // ignore storage errors
  }
}

function loadUnsorted(): RequestDefinition[] {
  try {
    const raw = localStorage.getItem(UNSORTED_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RequestDefinition[];
  } catch {
    return [];
  }
}

function persistUnsorted(items: RequestDefinition[]) {
  localStorage.setItem(UNSORTED_KEY, JSON.stringify(items));
}

function buildCollectionChildren(c: Collection): CollectionTreeNode[] {
  const folderNodes = new Map<string, CollectionTreeNode>();
  for (const f of c.folders)
    folderNodes.set(f.id, {
      kind: 'folder',
      id: f.id,
      name: f.name,
      parentId: f.parentId,
      children: [],
    });
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
      if (req)
        node.children.push({
          kind: 'request',
          id: req.id,
          name: req.name,
          parentId: node.id,
          children: [],
        });
    }
  }
  const unfiledRequests = c.requests.filter(
    (r) => !c.folders.some((f) => f.requestIds.includes(r.id)),
  );
  for (const r of unfiledRequests) {
    roots.push({ kind: 'request', id: r.id, name: r.name, parentId: c.id, children: [] });
  }
  return roots;
}

function findNodeInTree(
  nodes: readonly CollectionTreeNode[],
  id: string,
): CollectionTreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const child = findNodeInTree(n.children, id);
    if (child) return child;
  }
  return null;
}

export const useCollectionStore = defineStore('collections', {
  state: () => ({
    collections: [] as Collection[],
    activeCollectionId: null as string | null,
    activeRequestId: null as string | null,
    loading: false,
    error: null as string | null,
    service: null as CollectionService | null,
    unsortedRequests: [] as RequestDefinition[],
    requestCache: {} as Record<string, RequestDefinition>,
    requestCacheVersion: 0,
    requestLoading: false,
  }),

  getters: {
    activeCollection(state): Collection | null {
      return state.collections.find((c) => c.id === state.activeCollectionId) ?? null;
    },
    activeRequest(): RequestDefinition | null {
      if (!this.activeRequestId) return null;
      if (this.isRequestUnsorted(this.activeRequestId)) {
        const u = this.unsortedRequests.find((r) => r.id === this.activeRequestId);
        if (u) return u;
      }
      const cached = this.requestCache[this.activeRequestId];
      if (cached) return cached;
      const c = this.activeCollection;
      if (!c) return null;
      const summary = c.requests.find((r) => r.id === this.activeRequestId);
      if (summary && !('headers' in summary)) {
        return null;
      }
      return (summary as RequestDefinition | undefined) ?? null;
    },
    requestById(state) {
      return (id: string): RequestDefinition | null => {
        const u = state.unsortedRequests.find((r) => r.id === id);
        if (u) return u;
        for (const c of state.collections) {
          const r = c.requests.find((rr) => rr.id === id);
          if (r) return r;
        }
        return null;
      };
    },
    isRequestUnsorted(): (requestId: string) => boolean {
      return (requestId: string) => {
        return this.unsortedRequests.some((r) => r.id === requestId);
      };
    },
    workflows(state) {
      return state.collections.find((c) => c.id === state.activeCollectionId)?.workflows ?? [];
    },
    treeForActive(): CollectionTreeNode[] {
      const c = this.activeCollection;
      if (!c) return [];
      return buildCollectionChildren(c);
    },
    tree(): CollectionTreeNode[] {
      return this.collections.map(
        (c) =>
          ({
            kind: 'collection',
            id: c.id,
            name: c.name,
            parentId: null,
            children: buildCollectionChildren(c),
          }) as CollectionTreeNode,
      );
    },
    activeTreeNode() {
      return (folderId: string | null): CollectionTreeNode | null => {
        const c = this.activeCollection;
        if (!c) return null;
        if (!folderId) {
          return {
            kind: 'collection',
            id: c.id,
            name: c.name,
            parentId: null,
            children: buildCollectionChildren(c),
          };
        }
        return findNodeInTree(buildCollectionChildren(c), folderId);
      };
    },
    ownerCollectionId() {
      return (itemId: string): string | null => {
        for (const c of this.collections) {
          if (c.folders.some((f) => f.id === itemId) || c.requests.some((r) => r.id === itemId))
            return c.id;
        }
        return null;
      };
    },
  },

  actions: {
    bindService(service: CollectionService) {
      this.service = service;
    },
    restoreActiveState() {
      const state = loadActiveState();
      this.activeCollectionId = state.collectionId;
      this.activeRequestId = state.requestId;
    },
    persistActiveState() {
      persistActiveState(this.activeCollectionId, this.activeRequestId);
    },
    async refresh() {
      if (!this.service) return;
      this.loading = true;
      this.error = null;
      try {
        this.collections = (await this.service.list()).map((c) => c);
        this.unsortedRequests = loadUnsorted();
        persistUnsorted(this.unsortedRequests);
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
    async renameFolder(collectionId: string, folderId: string, name: string) {
      if (!this.service) return;
      const updated = await this.service.renameFolder(collectionId, folderId, name);
      this.replaceCollection(updated);
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
      const { collection, request } = await this.service.createRequest(
        this.activeCollectionId,
        name,
        folderId,
      );
      this.replaceCollection(collection);
      this.activeRequestId = request.id;
      return request;
    },
    async createUnsortedRequest(name: string): Promise<RequestDefinition> {
      const id = createId('req');
      const request: RequestDefinition = {
        id,
        name: name || 'New Request',
        method: 'GET',
        url: '',
        headers: [],
        queryParams: [],
        pathParams: [],
        body: { type: 'none' },
        auth: { type: 'none' },
        timeoutMs: 30_000,
        retry: {
          enabled: false,
          maxAttempts: 1,
          initialDelayMs: 500,
          backoff: 'fixed',
          retryOn: [],
          retryStatusCodes: [],
        },
        preRequest: [],
        postRequest: [],
        variableExtractions: [],
      };
      this.unsortedRequests = [...this.unsortedRequests, request];
      persistUnsorted(this.unsortedRequests);
      this.activeRequestId = id;
      return request;
    },
    async saveUnsortedRequestToCollection(requestId: string, collectionId: string, folderId: string | null = null) {
      if (!this.service) return null;
      const req = this.unsortedRequests.find((r) => r.id === requestId);
      if (!req) return null;
      const { collection, request } = await this.service.createRequest(collectionId, req.name, folderId);
      const updatedReq = { ...request, ...req };
      await this.service.updateRequest(collectionId, { ...updatedReq, id: request.id });
      this.replaceCollection(collection);
      this.unsortedRequests = this.unsortedRequests.filter((r) => r.id !== requestId);
      persistUnsorted(this.unsortedRequests);
      this.activeCollectionId = collectionId;
      this.activeRequestId = request.id;
      return request;
    },
    async updateRequest(request: RequestDefinition) {
      const cid = this.ownerCollectionId(request.id);
      if (!cid || !this.service) return;
      await this.service.saveRequest(cid, request);
      this.requestCache[request.id] = request;
      this.requestCacheVersion++;
    },
    async deleteRequest(requestId: string) {
      const cid = this.ownerCollectionId(requestId);
      if (cid && this.service) {
        await this.service.deleteRequestById(cid, requestId);
      }
      delete this.requestCache[requestId];
      this.requestCacheVersion++;
      this.unsortedRequests = this.unsortedRequests.filter((r) => r.id !== requestId);
      persistUnsorted(this.unsortedRequests);
      if (this.activeRequestId === requestId) this.activeRequestId = null;
    },
    async setCollectionVariables(variables: VariableEntry[]) {
      if (!this.service || !this.activeCollectionId) return;
      await this.service.updateVariablesDirect(this.activeCollectionId, variables);
    },
    async mergeCollectionVariables(updates: Record<string, string>) {
      const c = this.activeCollection;
      if (!c) return;
      const existing = new Map(c.variables.map((v) => [v.key, v]));
      for (const [key, value] of Object.entries(updates)) {
        const prev = existing.get(key);
        existing.set(key, prev ? { ...prev, value } : { key, value, enabled: true, secret: false });
      }
      await this.setCollectionVariables(Array.from(existing.values()));
    },
    async saveWorkflows(workflows: Workflow[]) {
      if (!this.service || !this.activeCollectionId) return;
      await this.service.updateWorkflowsDirect(this.activeCollectionId, workflows);
    },
    selectCollection(id: string) {
      this.activeCollectionId = id;
      this.activeRequestId = null;
      this.persistActiveState();
    },
    selectRequest(id: string) {
      this.activeRequestId = id;
      this.persistActiveState();
    },
    async loadRequest(collectionId: string, requestId: string): Promise<RequestDefinition | null> {
      if (!this.service) return null;
      const cached = this.requestCache[requestId];
      if (cached) return cached;
      this.requestLoading = true;
      try {
        const req = await this.service.getRequest(collectionId, requestId);
        if (req) {
          this.requestCache[requestId] = req;
          this.requestCacheVersion++;
          return req;
        }
        return null;
      } finally {
        this.requestLoading = false;
      }
    },
    replaceCollection(updated: Collection) {
      this.collections = this.collections.map((c) => (c.id === updated.id ? updated : c));
    },
  },
});

export function newRequestId(): string {
  return createId('req');
}
