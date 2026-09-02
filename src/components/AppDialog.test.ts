import { describe, expect, it, beforeAll } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import { createPinia } from 'pinia';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { useDialogStore } from '@stores/useDialogStore';
import AppDialog from '@components/AppDialog.vue';

const vuetify = createVuetify({ components, directives });

const Stub = defineComponent({ render: () => h('div', 'dialog content') });

class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

describe('AppDialog', () => {
  beforeAll(() => {
    const g = globalThis as unknown as { ResizeObserver: unknown; IntersectionObserver: unknown };
    g.ResizeObserver = RO;
    g.IntersectionObserver = RO;
  });

  it('closes when the app-bar close button is clicked', async () => {
    const pinia = createPinia();
    mount(AppDialog, { global: { plugins: [pinia, vuetify] } });
    const dialog = useDialogStore(pinia);
    dialog.openDialog({ component: Stub, title: 'Test dialog' });
    await nextTick();
    await new Promise((r) => setTimeout(r));
    await nextTick();

    expect(dialog.current).not.toBe(null);
    const close = document.body.querySelector('button[title="Close"]') as HTMLElement | null;
    expect(close).not.toBe(null);
    close!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();

    expect(dialog.current).toBe(null);
  });
});
