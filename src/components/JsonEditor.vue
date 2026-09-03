<template>
  <div class="json-editor">
    <CodeEditor
      ref="editor"
      v-model="raw"
      lang="json"
      placeholder="Enter valid JSON"
      :rows="rows"
      :variables="pickedVariableNames"
      :class="{ 'jce--invalid': valid === false }"
      @update:model-value="onInput"
    />
    <div class="d-flex align-center mt-1">
      <v-btn
        rounded="lg"
        prepend-icon="mdi-format-align-left"
        @click="format"
      >
        Format
      </v-btn>
      <v-spacer />
      <VariablePicker
        v-if="variables?.length"
        :variables="variables"
        @pick="insertAtCursor"
      />
      <v-chip
        v-if="valid === false"
        color="error"
        size="small"
        text="Invalid JSON"
      />
      <v-chip
        v-else-if="valid === true"
        color="success"
        size="small"
        text="Valid"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { VariableDef } from '@components/VariablePicker.vue';
import VariablePicker from '@components/VariablePicker.vue';
import CodeEditor from '@components/CodeEditor.vue';

const props = defineProps<{ modelValue: string; rows?: number; variables?: VariableDef[] }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>();

const editor = ref<InstanceType<typeof CodeEditor> | null>(null);
const raw = ref(props.modelValue ?? '');
const valid = ref<boolean | null>(null);

const pickedVariableNames = computed(() => (props.variables ?? []).map((v) => v.name));

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
  editor.value?.insertAtCursor(`{{${name}}}`);
}
</script>

<style scoped lang="scss">
.json-editor textarea {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.85rem;
}
.json-editor .jce--invalid {
  .jce__area {
    color: transparent;
  }
}
</style>
