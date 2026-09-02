import { describe, expect, it, beforeAll } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import JsonEditor from '@components/JsonEditor.vue';

class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
const vuetify = createVuetify({ components, directives });

describe('JsonEditor', () => {
  beforeAll(() => {
    const g = globalThis as unknown as { ResizeObserver: unknown; IntersectionObserver: unknown };
    (g as Record<string, unknown>).ResizeObserver = RO;
    (g as Record<string, unknown>).IntersectionObserver = RO;
  });

  it('auto-corrects a bare string into a quoted JSON string', async () => {
    const wrapper = mount(JsonEditor, { props: { modelValue: '' }, global: { plugins: [vuetify] } });
    const ta = wrapper.find('textarea');
    await ta.setValue('editor');
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toBe('"editor"');
  });

  it('formats valid JSON and emits pretty output', async () => {
    const wrapper = mount(JsonEditor, { props: { modelValue: '{"a":1,"b":2}' }, global: { plugins: [vuetify] } });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toBe('{\n  "a": 1,\n  "b": 2\n}');
  });
});
