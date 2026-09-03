<template>
  <div class="jce">
    <pre
      class="jce__mirror"
      aria-hidden="true"
      ref="mirror"
      :style="editorStyle"
      ><span v-for="(t, i) in tokens" :key="i" :class="`jce__tok--${t.type}`">{{ t.text }}</span></pre>
    <textarea
      ref="area"
      :value="text"
      :placeholder="placeholder"
      class="jce__area"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
      :style="editorStyle"
      @input="onInput"
      @keydown="onKeyDown"
      @blur="onBlur"
    />
    <nav v-show="showSuggest" class="jce__suggest">
      <ul class="jce__list">
        <li
          v-for="(s, i) in activeSuggestions"
          :key="`${s.kind}-${s.label}-${i}`"
          :class="{ 'jce__active': i === active }"
          @mousedown="pick(i)"
          @mouseenter="active = i"
        >
          <span class="jce__slabel">{{ s.label }}</span>
          <span class="jce__sline" />
          <span class="jce__sdetail">{{ s.detail }}</span>
        </li>
        <li v-if="!activeSuggestions.length" class="jce__empty" aria-hidden="true">
          No suggestions
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { tokenizeJs, type JsToken } from '@composables/useJsHighlight';
import { tokenizeJson, type JsonToken } from '@composables/useJsonHighlight';
import {
  getSuggestions,
  getCompletionContext,
  applySuggestion,
  type JsSuggestion,
} from '@composables/useJsSuggestions';

interface EditorToken {
  type: string;
  text: string;
}

type TokenSource = JsToken | JsonToken;

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    lang?: 'js' | 'json';
    placeholder?: string;
    variables?: string[];
    rows?: number;
  }>(),
  { modelValue: '', lang: 'js', placeholder: 'Write JS...', rows: 8 },
);
const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void;
  (e: 'change', v: string): void;
}>();

const area = ref<HTMLTextAreaElement | null>(null);
const mirror = ref<HTMLElement | null>(null);

const text = ref(props.modelValue);
const cursor = ref(0);
const active = ref(0);
const showSuggest = ref(false);
const blurTimer = ref<number | null>(null);

const editorStyle = computed(() => ({ minHeight: `${props.rows * 1.5}em` }));

watch(
  () => props.modelValue,
  (v) => {
    if (v !== text.value) text.value = v;
  },
);
watch(text, (v) => {
  if (v !== props.modelValue) emit('update:modelValue', v);
  emit('change', v);
});

const endsWithNewline = computed(() => text.value.endsWith('\n'));
const tokens = computed<EditorToken[]>(() => {
  const src = (props.lang === 'json' ? tokenizeJson : tokenizeJs)(text.value) as TokenSource[];
  if (!endsWithNewline.value) src.push({ type: 'ws', text: '\n' });
  return src;
});

const ctx = computed(() => getCompletionContext(text.value, cursor.value));
const suggestions = computed(() =>
  props.lang === 'js'
    ? getSuggestions(text.value, cursor.value, { variables: props.variables })
    : [],
);
const activeSuggestions = computed(() => suggestions.value);

function onInput(): void {
  const ta = area.value;
  if (ta) text.value = ta.value;
  cursor.value = ta ? ta.selectionStart ?? text.value.length : text.value.length;
  refreshSuggest();
  syncScroll();
}

function refreshSuggest(): boolean {
  const list = suggestions.value;
  if (!list || list.length === 0) {
    showSuggest.value = false;
    return false;
  }
  const isMemberAfterDot = ctx.value.mode === 'member' && ctx.value.prefix.length === 0;
  const isPrefix = ctx.value.prefix.length > 0;
  const canOpen = isMemberAfterDot || isPrefix;
  showSuggest.value = canOpen;
  if (canOpen) active.value = 0;
  return canOpen;
}

function onKeyDown(e: KeyboardEvent): void {
  if (showSuggest.value && activeSuggestions.value.length > 0) {
    const list = activeSuggestions.value;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      active.value = (active.value + 1) % list.length;
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      active.value = (active.value - 1 + list.length) % list.length;
      return;
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      pick(active.value);
      return;
    }
    if (e.key === 'Escape') {
      showSuggest.value = false;
      return;
    }
    return;
  }
  if (e.key === 'ArrowDown') {
    if (refreshSuggest()) e.preventDefault();
  }
}

function onBlur(): void {
  if (blurTimer.value !== null) clearTimeout(blurTimer.value);
  blurTimer.value = window.setTimeout(() => {
    showSuggest.value = false;
    blurTimer.value = null;
  }, 150);
}

function pick(i: number): void {
  const suggestion = activeSuggestions.value[i];
  if (!suggestion) return;
  const result = applySuggestion(text.value, cursor.value, ctx.value, suggestion);
  text.value = result.source;
  cursor.value = result.cursor;
  emit('update:modelValue', result.source);
  showSuggest.value = false;
  nextTick(() => {
    const ta = area.value;
    if (ta) {
      ta.setSelectionRange(result.cursor, result.cursor);
      ta.focus();
    }
  });
}

function syncScroll(): void {
  const ta = area.value;
  const m = mirror.value;
  if (ta && m) {
    m.scrollTop = ta.scrollTop;
    m.scrollLeft = ta.scrollLeft;
  }
}

function insertAtCursor(inserted: string): void {
  const ta = area.value;
  if (!ta) {
    const val = text.value;
    const next = `${val}${inserted}`;
    text.value = next;
    emit('update:modelValue', next);
    return;
  }
  const start = ta.selectionStart ?? 0;
  const end = ta.selectionEnd ?? 0;
  const val = text.value;
  const next = `${val.slice(0, start)}${inserted}${val.slice(end)}`;
  const nc = start + inserted.length;
  text.value = next;
  cursor.value = nc;
  emit('update:modelValue', next);
  nextTick(() => {
    ta.setSelectionRange(nc, nc);
    ta.focus();
  });
}

function focus(): void {
  area.value?.focus();
}

defineExpose<{ insertAtCursor: (s: string) => void; focus: () => void }>({
  insertAtCursor,
  focus,
});
</script>

<style scoped lang="scss">
$jce-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
$jce-fg: var(--jce-text, #d4d4d4);
$jce-bg: var(--jce-bg, #1e1e1e);
$jce-border: var(--jce-border, #3c3c3c);

.jce {
  position: relative;
  min-height: 1.5rem;
  font-family: $jce-family;
  font-size: 0.85rem;
  line-height: 1.5;
  letter-spacing: 0.01em;
}

.jce__mirror,
.jce__area {
  margin: 0;
  padding: 6px 8px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  white-space: pre-wrap;
  word-break: break-all;
  word-wrap: break-word;
  font-family: $jce-family;
  font-size: 0.85rem;
  line-height: 1.5;
  letter-spacing: 0.01em;
}

.jce__mirror {
  position: relative;
  overflow: auto;
  max-height: 420px;
  background: $jce-bg;
  color: $jce-fg;
  border: 1px solid $jce-border;
  border-radius: 4px;
  overflow-wrap: break-word;
  z-index: 0;
}

.jce__area {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 1;
  color: transparent;
  background: transparent;
  caret-color: $jce-fg;
  border: none;
  outline: none;
  resize: none;
  overflow: auto;
  tab-size: 2;
}

.jce__area::placeholder {
  color: var(--v-theme-on-surface-variant, #9ca3af);
}

.jce__tok--keyword {
  color: #c586c0;
}
.jce__tok--builtin {
  color: #4ec9b0;
}
.jce__tok--context {
  color: #4ec9b0;
  font-weight: 600;
}
.jce__tok--comment {
  color: #6a9955;
}
.jce__tok--string {
  color: #ce9178;
}
.jce__tok--template {
  color: #ce9178;
}
.jce__tok--number {
  color: #b5cea8;
}
.jce__tok--regex {
  color: #d7ba7d;
}
.jce__tok--punct {
  color: #d4d4d4;
}
.jce__tok--ident {
  color: $jce-fg;
}
.jce__tok--key {
  color: #9cdcfe;
}
.jce__tok--boolean {
  color: #569cd6;
}
.jce__tok--null {
  color: #569cd6;
}
.jce__tok--ws {
  color: $jce-fg;
}

.jce__suggest {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
  max-height: 280px;
  overflow: auto;
  background: var(--jce-suggest-bg, #252526);
  border: 1px solid $jce-border;
  border-top: none;
  border-radius: 0 0 4px 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
}

.jce__list {
  list-style: none;
  margin: 0;
  padding: 2px 0;
  max-height: 260px;
  overflow: auto;
}

.jce__list li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 10px;
  cursor: pointer;
  border-radius: 2px;
  color: $jce-fg;
}

.jce__list li.jce__active,
.jce__list li:hover {
  background: var(--jce-suggest-active-bg, #2a2d32);
  color: #ffffff;
}

.jce__list li.jce__empty {
  cursor: default;
  color: var(--v-theme-on-surface-variant, #9ca3af);
}

.jce__slabel {
  font-weight: 600;
}
.jce__sline {
  flex: 1;
  height: 1px;
  background: var(--jce-border, #3c3c3c);
}
.jce__sdetail {
  color: #9cdcfe;
  font-size: 0.78rem;
}
</style>
