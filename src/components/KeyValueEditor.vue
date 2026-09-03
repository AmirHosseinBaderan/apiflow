<template>
  <div>
    <v-row v-for="row in local" :key="row.id" dense align="center" class="mb-1">
      <v-col cols="auto">
        <v-checkbox-btn
          :model-value="row.enabled"
          @update:model-value="(v) => update(row.id, 'enabled', v ?? false)"
          density="compact"
        />
      </v-col>
      <v-col>
        <v-text-field
          :model-value="row.key"
          placeholder="key"
          hide-details
          density="compact"
          @update:model-value="(v) => update(row.id, 'key', v ?? '')"
        />
      </v-col>
      <v-col>
        <v-text-field
          :model-value="row.value"
          placeholder="value"
          hide-details
          density="compact"
          @update:model-value="(v) => update(row.id, 'value', v ?? '')"
        >
          <template #append>
            <VariablePicker
              v-if="variables.length"
              :variables="variables"
              @pick="(n) => update(row.id, 'value', `${row.value ?? ''}{{${n}}}'`)"
            />
          </template>
        </v-text-field>
      </v-col>
      <v-col cols="auto">
        <v-btn icon="mdi-delete" size="small" variant="text" @click="remove(row.id)" />
      </v-col>
    </v-row>
    <v-btn size="small" variant="text" prepend-icon="mdi-plus" @click="add">Add</v-btn>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { KeyValue } from '@domain/request/RequestDefinition';
import type { VariableDef } from '@components/VariablePicker.vue';
import { createId } from '@shared/id';
import VariablePicker from '@components/VariablePicker.vue';

const props = defineProps<{
  modelValue: ReadonlyArray<KeyValue>;
  variables: VariableDef[];
}>();
const emit = defineEmits<{ (e: 'update:modelValue', v: KeyValue[]): void }>();

const local = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', [...v]),
});

function add() {
  const next: KeyValue = { id: createId('kv'), key: '', value: '', enabled: true };
  emit('update:modelValue', [...props.modelValue, next]);
}

function remove(id: string) {
  emit(
    'update:modelValue',
    props.modelValue.filter((r) => r.id !== id),
  );
}

function update<K extends keyof KeyValue>(id: string, field: K, value: KeyValue[K]) {
  const next = props.modelValue.map((r) => (r.id === id ? { ...r, [field]: value } : r));
  emit('update:modelValue', next as KeyValue[]);
}
</script>
