import { describe, expect, it, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createPinia } from 'pinia';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createRouter, createMemoryHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { routes } from '@app/router';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useExecutionStore } from '@stores/useExecutionStore';
import { createCollectionWithRequests } from './test-utils';
import WorkflowPage from '@modules/workspace/WorkflowPage.vue';

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList;
}

const vuetify = createVuetify({ components, directives });
const testRoutes: RouteRecordRaw[] = [...routes, { path: '/:pathMatch(.*)*', redirect: '/' }];

describe('WorkflowPage', () => {
  it('renders the selected workflow steps and a run button', async () => {
    const pinia = createPinia();
    const router = createRouter({ history: createMemoryHistory(), routes: testRoutes });
    const collection = createCollectionWithRequests();
    const store = useCollectionStore(pinia);
    store.collections = [collection];
    store.activeCollectionId = collection.id;
    const execution = useExecutionStore(pinia);
    execution.service = null;

    router.push({ name: 'workflow', params: { collectionId: collection.id, workflowId: 'wf-1' } });
    await router.isReady();

    const wrapper = mount(WorkflowPage, { global: { plugins: [pinia, router, vuetify] } });
    await nextTick();
    await nextTick();

    expect(wrapper.text()).toContain('My workflow');
    expect(wrapper.text()).toContain('Run workflow');
    expect(wrapper.text()).toContain('Steps (2)');
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });
});
