import { describe, expect, it, beforeAll } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { VTreeview } from 'vuetify/labs/VTreeview';
import { router } from '@app/router';
import { ServicesKey } from '@app/providers/injectKeys';
import App from '@app/App.vue';

class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

const vuetify = createVuetify({ components: { ...components, VTreeview }, directives });

describe('App shell', () => {
  beforeAll(() => {
const g = globalThis as unknown as {
  ResizeObserver: unknown;
  IntersectionObserver: unknown;
};
g.ResizeObserver = RO;
g.IntersectionObserver = RO;
  });

  it('renders the sidebar on the home route', async () => {
    const pinia = createPinia();
    const wrapper = mount(App, {
      global: {
        plugins: [pinia, router, vuetify],
        provide: { [ServicesKey as symbol]: { openApiService: { importFromText: () => null } } },
      },
    });
    await router.replace({ name: 'home' });
    await wrapper.vm.$nextTick();
    const text = wrapper.text();
    expect(text).toContain('Quick create');
  });
});
