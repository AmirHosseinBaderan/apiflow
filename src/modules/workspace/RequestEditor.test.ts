import { describe, expect, it, beforeAll } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createPinia } from 'pinia';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import type { RequestDefinition } from '@domain/request/RequestDefinition';
import { emptyRequest } from '@domain/request/RequestDefinition';
import RequestEditor from '@modules/workspace/RequestEditor.vue';

const vuetify = createVuetify({ components, directives });

function findTab(wrapper: ReturnType<typeof mount>, label: string) {
  const btn = wrapper.findAll('button').filter((b) => b.text() === label);
  return btn[0];
}

const sample: RequestDefinition = {
  ...emptyRequest('req-1', 'Get user'),
  method: 'GET',
  url: 'https://api.example.com/users/{id}',
  headers: [{ id: 'h1', key: 'X-Request-Id', value: 'abc', enabled: true }],
  pathParams: [{ id: 'p1', key: 'id', value: '42', enabled: true }],
  queryParams: [{ id: 'q1', key: 'limit', value: '10', enabled: true }],
  body: { type: 'json', content: '{\n  "name": "x"\n}' },
};

class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

describe('RequestEditor', () => {
  beforeAll(() => {
    const g = globalThis as unknown as { ResizeObserver: unknown; IntersectionObserver: unknown };
    g.ResizeObserver = RO;
    g.IntersectionObserver = RO;
  });

  it('renders imported path params, query params, headers and body', async () => {
    const wrapper = mount(RequestEditor, {
      props: { request: sample },
      global: { plugins: [createPinia(), vuetify] },
    });
    await nextTick();
    await nextTick();

    const text = wrapper.text();
    expect(text).toContain('Path params');
    expect(text).toContain('id');
    expect(text).toContain('limit');

    await findTab(wrapper, 'Headers').trigger('click');
    await nextTick();
    expect(wrapper.text()).toContain('X-Request-Id');

    await findTab(wrapper, 'Body').trigger('click');
    await nextTick();
    const ta = wrapper.findAll('textarea').find((t) => (t.element as HTMLTextAreaElement).value.includes('name'));
    expect(ta).toBeTruthy();
  });
});
