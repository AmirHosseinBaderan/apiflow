import { defineStore } from 'pinia';
import type { RouteLocationRaw } from 'vue-router';

export type TabKind = 'home' | 'collection' | 'node' | 'request' | 'workflow';

export interface TabMeta {
  collectionId?: string;
  folderId?: string;
  requestId?: string;
  workflowId?: string;
}

export interface Tab {
  id: string;
  title: string;
  kind: TabKind;
  meta: TabMeta;
  route: RouteLocationRaw;
}

function tabKey(kind: TabKind, meta: TabMeta): string {
  switch (kind) {
    case 'home':
      return 'home';
    case 'collection':
      return `collection:${meta.collectionId}`;
    case 'node':
      return `node:${meta.collectionId}:${meta.folderId}`;
    case 'request':
      return `request:${meta.collectionId}:${meta.requestId}`;
    case 'workflow':
      return `workflow:${meta.collectionId}:${meta.workflowId}`;
  }
}

export const useTabStore = defineStore('tabs', {
  state: () => ({
    tabs: [] as Tab[],
    activeTabId: null as string | null,
  }),

  getters: {
    activeTab(state): Tab | undefined {
      return state.tabs.find((t) => t.id === state.activeTabId);
    },
  },

  actions: {
    open(tab: Omit<Tab, 'id'>): Tab {
      const key = tabKey(tab.kind, tab.meta);
      const existing = this.tabs.find((t) => t.id === key);
      if (existing) {
        this.activeTabId = existing.id;
        return existing;
      }
      const newTab: Tab = { ...tab, id: key };
      this.tabs = [...this.tabs, newTab];
      this.activeTabId = newTab.id;
      return newTab;
    },
    activate(id: string) {
      if (this.tabs.some((t) => t.id === id)) this.activeTabId = id;
    },
    remove(id: string) {
      const idx = this.tabs.findIndex((t) => t.id === id);
      if (idx < 0) return;
      const remaining = this.tabs.filter((t) => t.id !== id);
      let nextActive = this.activeTabId;
      if (nextActive === id) {
        const prev = remaining[idx - 1] ?? remaining[idx] ?? remaining[0];
        nextActive = prev?.id ?? null;
      }
      this.tabs = remaining;
      this.activeTabId = nextActive;
    },
    next() {
      if (!this.tabs.length) return;
      const i = this.tabs.findIndex((t) => t.id === this.activeTabId);
      const next = this.tabs[(i + 1) % this.tabs.length];
      if (next) this.activeTabId = next.id;
    },
    prev() {
      if (!this.tabs.length) return;
      const i = this.tabs.findIndex((t) => t.id === this.activeTabId);
      const n = this.tabs.length;
      const next = this.tabs[(i - 1 + n) % n];
      if (next) this.activeTabId = next.id;
    },
    clear() {
      this.tabs = [];
      this.activeTabId = null;
    },
    openRoute(name: string, params: Record<string, string | undefined>, title: string): Tab {
      const collectionId = params.collectionId;
      const folderId = params.folderId;
      const requestId = params.requestId;
      const workflowId = params.workflowId;
      let kind: TabKind = 'home';
      if (requestId) kind = 'request';
      else if (workflowId) kind = 'workflow';
      else if (folderId) kind = 'node';
      else if (collectionId) kind = 'collection';
      return this.open({
        title,
        kind,
        meta: { collectionId, folderId, requestId, workflowId },
        route: { name, params },
      });
    },
  },
});
