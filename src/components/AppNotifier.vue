<template>
  <v-snackbar
    v-for="item in state.items"
    :key="item.id"
    :model-value="true"
    :color="colorFor(item.kind)"
    location="bottom right"
    @update:model-value="dismiss(item.id)"
  >
    {{ item.text }}
    <template #actions>
      <v-btn variant="text" @click="dismiss(item.id)">Close</v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { useNotifier } from '@composables/useNotifier';
const { state, dismiss } = useNotifier();
function colorFor(kind: 'info' | 'success' | 'error' | 'warning'): string {
  return kind === 'success' ? 'success' : kind === 'error' ? 'error' : kind === 'warning' ? 'warning' : 'info';
}
</script>