import { describe, expect, it, beforeAll } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createRouter, createMemoryHistory } from 'vue-router';
import { defineComponent, h, nextTick } from 'vue';
import WorkspaceHeader from '@modules/workspace/WorkspaceHeader.vue';

const vuetify = createVuetify({ components, directives });

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'home', component: { render: () => h('div', 'home') } },
    { path: '/collections/:collectionId', name: 'collection', component: { render: () => h('div', 'collection') } },
  ],
});

const Wrapper = defineComponent({
  components: { WorkspaceHeader },
  template: '<v-app><WorkspaceHeader :active-collection="null" /></v-app>',
});

class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

describe('WorkspaceHeader', () => {
  beforeAll(() => {
    const g = globalThis as unknown as { ResizeObserver: unknown; IntersectionObserver: unknown };
    g.ResizeObserver = RO;
    g.IntersectionObserver = RO;
  });

  it('navigates to home when the app bar title is clicked', async () => {
    const wrapper = mount(Wrapper, {
      global: { plugins: [createPinia(), vuetify, router] },
    });
    await router.replace({ name: 'collection', params: { collectionId: 'x' } });
    await wrapper.find('.v-app-bar-title').trigger('click');
    await new Promise((r) => setTimeout(r));
    await nextTick();
    expect(router.currentRoute.value.name).toBe('home');
  });
});
