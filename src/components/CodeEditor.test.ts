import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import CodeEditor from '@components/CodeEditor.vue';

function typeAt(wrapper: ReturnType<typeof mount>, value: string, caret: number) {
  const ta = wrapper.find('textarea');
  return ta.setValue(value).then(() => {
    (ta.element as HTMLTextAreaElement).setSelectionRange(caret, caret);
    return ta.trigger('input');
  });
}

describe('CodeEditor', () => {
  it('reflects the model value in the textarea', async () => {
    const wrapper = mount(CodeEditor, { props: { modelValue: 'return 1' } });
    await nextTick();
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('return 1');
  });

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(CodeEditor, { props: { modelValue: '' } });
    await typeAt(wrapper, 'return true', 10);
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.at(0)).toBe('return true');
  });

  it('renders syntax-highlighted tokens', async () => {
    const wrapper = mount(CodeEditor, { props: { modelValue: 'return 1' } });
    await nextTick();
    const labels = wrapper.findAll('.jce__tok--keyword').map((w) => w.text());
    expect(labels).toContain('return');
  });

  it('renders JSON-highlighted keys and numbers', async () => {
    const wrapper = mount(CodeEditor, { props: { modelValue: '{"a":1}', lang: 'json' } });
    await nextTick();
    const types = wrapper
      .findAll('.jce__mirror span')
      .map((w) => w.classes())
      .map((c) => c.find((x) => x.startsWith('jce__tok--')));
    expect(
      types.some((c) => c === 'jce__tok--key'),
    ).toBe(true);
    expect(
      types.some((c) => c === 'jce__tok--number'),
    ).toBe(true);
  });

  it('shows member suggestions after typing a dot', async () => {
    const wrapper = mount(CodeEditor, { props: { modelValue: '', lang: 'js' } });
    await typeAt(wrapper, 'response.', 9);
    const labels = wrapper.findAll('.jce__slabel').map((w) => w.text());
    expect(labels).toEqual(expect.arrayContaining(['status', 'headers', 'body', 'bodyText']));
  });

  it('filters suggestions by the prefix before the dot', async () => {
    const wrapper = mount(CodeEditor, { props: { modelValue: '', lang: 'js' } });
    await typeAt(wrapper, 'response.s', 10);
    const labels = wrapper.findAll('.jce__slabel').map((w) => w.text());
    expect(labels).toEqual(['status']);
  });

  it('inserts a suggestion on click', async () => {
    const wrapper = mount(CodeEditor, { props: { modelValue: '', lang: 'js' } });
    await typeAt(wrapper, 'response.', 9);
    await wrapper.find('.jce__suggest li').trigger('mousedown');
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.at(0)).toBe('response.status');
  });

  it('inserts a suggestion via keyboard Enter', async () => {
    const wrapper = mount(CodeEditor, { props: { modelValue: '', lang: 'js' } });
    await typeAt(wrapper, 'response.', 9);
    await wrapper.find('textarea').trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.at(0)).toBe('response.status');
  });

  it('does not show suggestions for unknown objects', async () => {
    const wrapper = mount(CodeEditor, { props: { modelValue: '', lang: 'js' } });
    await typeAt(wrapper, 'foo.', 4);
    const labels = wrapper.findAll('.jce__slabel').map((w) => w.text());
    expect(labels).toEqual([]);
    expect(await wrapper.find('.jce__suggest').isVisible()).toBe(false);
  });

  it('inserts variables at the cursor via the exposed method', async () => {
    const wrapper = mount(CodeEditor, { props: { modelValue: 'const x = 1;', lang: 'js' } });
    await nextTick();
    const ta = wrapper.find('textarea');
    (ta.element as HTMLTextAreaElement).setSelectionRange(10, 10);
    await ta.trigger('input');
    wrapper.vm.insertAtCursor('{{userId}}');
    await nextTick();
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe(
      'const x = {{userId}}1;',
    );
  });
});
