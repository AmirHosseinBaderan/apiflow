<template>
  <div class="json-editor">
    <v-textarea
      ref="editor"
      v-model="raw"
      :color="valid === false ? 'error' : undefined"
      :rows="rows"
      density="compact"
      hide-details
      placeholder="Enter valid JSON"
      @input="onInput"
      @blur="onBlur"
    />
    <div class="d-flex align-center mt-1">
      <v-btn size="small" variant="text" prepend-icon="mdi-format-align-left" @click="format">Format</v-btn>
      <v-spacer />
      <VariablePicker
        v-if="variables?.length"
        :variables="variables"
        @pick="insertAtCursor"
      />
      <v-chip v-if="valid === false" color="error" size="small" text="Invalid JSON" />
      <v-chip v-else-if="valid === true" color="success" size="small" text="Valid" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import type { VariableDef } from '@components/VariablePicker.vue';
import VariablePicker from '@components/VariablePicker.vue';

const props = defineProps<{ modelValue: string; rows?: number; variables?: VariableDef[] }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>();

const editor = ref<unknown>(null);
const raw = ref(props.modelValue ?? '');
const valid = ref<boolean | null>(null);

watch(
  () => props.modelValue,
  (v) => {
    raw.value = v ?? '';
  },
);

const rows = props.rows ?? 8;

function tryParse(src: string) {
  try {
    return { ok: true as const, value: JSON.parse(src) };
  } catch {
    return normalizeJson(src);
  }
}

function normalizeJson(src: string) {
  let s = src.trim();
  try {
    if (!s) return { ok: false as const };
    if (/^[A-Za-z_$][\w$ .]*$/.test(s) && !/^(true|false|null)$/.test(s)) {
      return { ok: true as const, value: JSON.parse('"' + s.replace(/"/g, '\\"') + '"') };
    }
    s = s.replace(/,\s*([}\]])/g, '$1');
    s = s.replace(/([{,]\s*)([A-Za-z_$][\w$]*)(\s*:)/g, '$1"$2"$3');
    s = s.replace(/:\s*([A-Za-z_$][\w$ .]*)\s*([,}\]])/g, (_m, p1: string, p2: string) => {
      const t = p1.trim();
      if (/^(true|false|null)$/.test(t)) return `: ${t}${p2}`;
      return `: "${t}"${p2}`;
    });
    return { ok: true as const, value: JSON.parse(s) };
  } catch {
    return { ok: false as const };
  }
}

function validate(src: string) {
  const result = tryParse(src);
  valid.value = result.ok;
  return result;
}

function onInput() {
  validate(raw.value);
}

async function onBlur() {
  const result = validate(raw.value);
  if (result.ok) {
    const formatted = JSON.stringify(result.value, null, 2);
    if (formatted !== raw.value) {
      raw.value = formatted;
      emit('update:modelValue', formatted);
      await nextTick();
    }
  }
}

function format() {
  const result = validate(raw.value);
  if (result.ok) {
    const formatted = JSON.stringify(result.value, null, 2);
    raw.value = formatted;
    emit('update:modelValue', formatted);
  } else {
    valid.value = false;
  }
}

function insertAtCursor(name: string) {
  const token = `{{${name}}}`;
  const el = (editor.value as { el?: HTMLElement } | null)?.el;
  const ta = el?.querySelector('textarea') as HTMLTextAreaElement | undefined;
  if (!ta) {
    raw.value = `${raw.value}${token}`;
    emit('update:modelValue', raw.value);
    return;
  }
  const start = ta.selectionStart ?? raw.value.length;
  const end = ta.selectionEnd ?? start;
  raw.value = `${raw.value.slice(0, start)}${token}${raw.value.slice(end)}`;
  emit('update:modelValue', raw.value);
  nextTick(() => {
    ta.setSelectionRange(start + token.length, start + token.length);
    ta.focus();
  });
}
</script>

<style scoped lang="scss">
.json-editor textarea {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.85rem;
}
</style>
