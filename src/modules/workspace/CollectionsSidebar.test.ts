import { describe, expect, it, beforeAll, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { VTreeview } from 'vuetify/labs/VTreeview';
import { createRouter, createMemoryHistory } from 'vue-router';
import { useCollectionStore } from '@stores/useCollectionStore';
import { CollectionService } from '@application/collections/CollectionService';
import type { Collection } from '@domain/collection/Collection';
import CollectionsSidebar from '@modules/workspace/CollectionsSidebar.vue';

const vuetify = createVuetify({ components: { ...components, VTreeview }, directives });

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'home', component: { render: () => h('div', 'home') } },
    { path: '/collections/:collectionId', name: 'collection', component: { render: () => h('div', 'collection') } },
    { path: '/collections/:collectionId/folders/:folderId', name: 'node', component: { render: () => h('div', 'node') } },
    { path: '/collections/:collectionId/requests/:requestId', name: 'request', component: { render: () => h('div', 'request') } },
  ],
});

class MemoryRepo {
  data: Map<string, Collection> = new Map();
  async list() {
    return Array.from(this.data.values());
  }
  async get(id: string) {
    return this.data.get(id);
  }
  async save(c: Collection) {
    this.data.set(c.id, c);
  }
  async remove(id: string) {
    this.data.delete(id);
  }
}

const Wrapper = defineComponent({
  components: { CollectionsSidebar },
  template: '<v-app><CollectionsSidebar/></v-app>',
});

describe('CollectionsSidebar render', () => {
  beforeAll(() => {
    class RO {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }
const g = globalThis as unknown as {
  ResizeObserver: unknown;
  IntersectionObserver: unknown;
};
g.ResizeObserver = RO;
g.IntersectionObserver = RO;
  });
  it('renders collection names in an expandable tree', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useCollectionStore();
    const repo = new MemoryRepo();
    store.bindService(new CollectionService(repo as never));
    await store.createCollection('Demo');
    await store.createFolder('Users');
    await store.createRequest('Get User');

    const wrapper = mount(Wrapper, {
             global: { plugins: [pinia, vuetify, router] },
       });
       await wrapper.vm.$nextTick();

    const text = wrapper.text();
    expect(text).toContain('Demo');
    expect(text).toContain('Users');
    expect(text).toContain('Get User');
  });

  it('navigates to the request page when a tree item is activated', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useCollectionStore();
    const repo = new MemoryRepo();
    store.bindService(new CollectionService(repo as never));
    await store.createCollection('Demo');
    await store.createFolder('Users');
    await store.createRequest('Get User');

    const wrapper = mount(Wrapper, {
      global: { plugins: [pinia, vuetify, router] },
    });
    await router.isReady();
    await wrapper.vm.$nextTick();

    const reqId = store.activeRequestId as string;
    const pushSpy = vi.spyOn(router, 'push');
    const labels = wrapper.findAll('span').filter((s) => s.text() === 'Get User');
    expect(labels.length).toBeGreaterThan(0);
    await labels[0].trigger('click');
    const pushPromise = pushSpy.mock.results[0]?.value;
    if (pushPromise && typeof (pushPromise as Promise<unknown>).then === 'function')
      await pushPromise;
    await router.isReady();
    await nextTick();

    expect(router.currentRoute.value.name).toBe('request');
    expect(router.currentRoute.value.params.requestId).toBe(reqId);
  });
});
