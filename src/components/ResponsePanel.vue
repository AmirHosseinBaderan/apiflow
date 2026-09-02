<template>
  <v-card>
    <v-card-title class="text-subtitle-1">Status</v-card-title>
    <v-card-text>
      <v-chip :color="statusColor" label>
        {{ response?.status ?? '—' }} {{ response?.statusText ?? '' }}
      </v-chip>
      <v-chip class="ml-2" color="info" label>{{ response?.durationMs ?? 0 }} ms</v-chip>
      <v-chip class="ml-2" label>{{ response?.size ?? 0 }} bytes</v-chip>
    </v-card-text>
    <v-divider />
    <ResponseViewer :response="response" />
    <v-divider />
    <v-card-title class="text-subtitle-1">Tests</v-card-title>
    <v-card-text>
      <v-alert v-if="!tests?.length" type="info" variant="tonal">No tests defined.</v-alert>
      <v-list v-else density="compact">
        <v-list-item v-for="t in tests ?? []" :key="t.id">
          <template #prepend>
            <v-icon :color="iconColor(t.status)">{{ iconFor(t.status) }}</v-icon>
          </template>
          <v-list-item-title>{{ t.name }}</v-list-item-title>
          <v-list-item-subtitle v-if="t.error">{{ t.error }}</v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-card-text>
    <v-divider />
    <v-card-title class="text-subtitle-1">Extracted Variables</v-card-title>
    <v-card-text>
      <v-alert v-if="!extracted || Object.keys(extracted).length === 0" type="info" variant="tonal">None.</v-alert>
      <v-table v-else density="compact">
        <thead><tr><th>Name</th><th>Value</th></tr></thead>
        <tbody>
          <tr v-for="(v, k) in extracted" :key="k"><td>{{ k }}</td><td>{{ v }}</td></tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ExecutionResponse, TestResult } from '@domain/test/TestResult';
import ResponseViewer from './ResponseViewer.vue';

const props = defineProps<{
  response: ExecutionResponse | undefined;
  tests: ReadonlyArray<TestResult> | undefined;
  extracted: Readonly<Record<string, string>> | undefined;
}>();

const statusColor = computed(() => {
  const s = props.response?.status ?? 0;
  if (!s) return 'grey';
  if (s < 300) return 'success';
  if (s < 400) return 'info';
  if (s < 500) return 'warning';
  return 'error';
});

function iconFor(status: string): string {
  return status === 'passed' ? 'mdi-check' : status === 'failed' ? 'mdi-close' : status === 'error' ? 'mdi-alert' : 'mdi-minus';
}
function iconColor(status: string): string {
  return status === 'passed' ? 'success' : status === 'failed' ? 'error' : status === 'error' ? 'warning' : 'grey';
}
</script>