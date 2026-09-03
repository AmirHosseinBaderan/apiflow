<template>
  <div>
    <v-row v-for="v in local" :key="v.id" dense class="mb-1" align="center">
      <v-col cols="4"><v-text-field v-model="v.name" placeholder="variable name" hide-details /></v-col>
      <v-col cols="7"><v-text-field v-model="v.path" placeholder="e.g. body.accessToken" hide-details /></v-col>
      <v-col cols="auto"><v-btn icon="mdi-delete" variant="text" @click="remove(v.id)" /></v-col>
    </v-row>
    <v-btn variant="text" prepend-icon="mdi-plus" @click="add">Add extraction</v-btn>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { VariableExtraction } from '@domain/request/RequestDefinition';
import { createId } from '@shared/id';

const props = defineProps<{ modelValue: ReadonlyArray<VariableExtraction> }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: VariableExtraction[]): void }>();

const local = computed({
  get: () => props.modelValue as VariableExtraction[],
  set: (v) => emit('update:modelValue', v as VariableExtraction[]),
});

function add() {
  const next: VariableExtraction = { id: createId('ext'), name: '', path: '' };
  emit('update:modelValue', [...props.modelValue, next]);
}

function remove(id: string) {
  emit('update:modelValue', props.modelValue.filter((v) => v.id !== id));
}
</script>