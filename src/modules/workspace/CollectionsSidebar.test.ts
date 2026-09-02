import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { VTreeview } from 'vuetify/labs/VTreeview';
import { useCollectionStore } from '@stores/useCollectionStore';
import { CollectionService } from '@application/collections/CollectionService';
import type { Collection } from '@domain/collection/Collection';
import CollectionsSidebar from '@modules/workspace/CollectionsSidebar.vue';

const vuetify = createVuetify({ components: { ...components, VTreeview }, directives });

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
    (globalThis as any).ResizeObserver = RO;
    (globalThis as any).IntersectionObserver = RO;
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
      global: { plugins: [pinia, vuetify] },
    });
    await wrapper.vm.$nextTick();

    const text = wrapper.text();
    expect(text).toContain('Demo');
    expect(text).toContain('Users');
    expect(text).toContain('Get User');
  });
});
