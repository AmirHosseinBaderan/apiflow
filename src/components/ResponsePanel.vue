<template>
  <v-card>
    <v-card-title class="d-flex align-center text-subtitle-1">
      <span>Response</span>
      <v-spacer />
      <v-chip v-if="response" :color="statusColor" label size="small">
        {{ response.status }} {{ response.statusText }}
      </v-chip>
      <v-chip v-if="response" class="ml-2" color="info" label size="small">{{ response.durationMs }} ms</v-chip>
      <v-chip v-if="response" class="ml-2" label size="small">{{ response.size }} bytes</v-chip>
      <v-chip v-if="attempts" class="ml-2" color="warning" label size="small">{{ attempts }} attempts</v-chip>
    </v-card-title>
    <v-card-text>
      <v-alert v-if="!response && !errors?.length" type="info" variant="tonal">No response yet. Click Send to run the request.</v-alert>
      <v-alert v-for="(e, i) in errors ?? []" :key="i" type="error" variant="tonal" class="mb-1">{{ e }}</v-alert>
      <ResponseViewer v-if="response" :response="response" />
    </v-card-text>
    <v-divider />
    <v-card-title class="text-subtitle-1 d-flex align-center">
      <span>Tests</span>
      <v-spacer />
      <v-chip
        v-if="tests && tests.length"
        size="small"
        :color="allPassed ? 'success' : 'error'"
        label
      >{{ passedCount }} / {{ tests.length }} passed</v-chip>
    </v-card-title>
    <v-card-text>
      <v-alert v-if="!tests?.length" type="info" variant="tonal">No tests defined.</v-alert>
      <v-list v-else density="compact">
        <v-list-item v-for="t in tests" :key="t.id">
          <template #prepend>
            <v-icon :color="iconColor(t.status)">{{ iconFor(t.status) }}</v-icon>
          </template>
          <v-list-item-title>{{ t.name }}</v-list-item-title>
          <v-list-item-subtitle>
            <span v-if="t.error" class="text-error">{{ t.error }}</span>
            <span v-else>
              expected <code>{{ formatValue(t.expectedValue) }}</code> · got <code>{{ formatValue(t.actualValue) }}</code> · {{ t.durationMs }}ms
            </span>
          </v-list-item-subtitle>
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
  errors?: ReadonlyArray<string>;
  attempts?: number;
}>();

const statusColor = computed(() => {
  const s = props.response?.status ?? 0;
  if (!s) return 'grey';
  if (s < 300) return 'success';
  if (s < 400) return 'info';
  if (s < 500) return 'warning';
  return 'error';
});

const passedCount = computed(() => (props.tests ?? []).filter((t) => t.status === 'passed').length);
const allPassed = computed(() => passedCount.value === (props.tests?.length ?? 0) && (props.tests?.length ?? 0) > 0);

function iconFor(status: string): string {
  return status === 'passed' ? 'mdi-check' : status === 'failed' ? 'mdi-close' : status === 'error' ? 'mdi-alert' : 'mdi-minus';
}
function iconColor(status: string): string {
  return status === 'passed' ? 'success' : status === 'failed' ? 'error' : status === 'error' ? 'warning' : 'grey';
}
function formatValue(v: unknown): string {
  if (v === undefined) return '—';
  if (typeof v === 'string') return v;
  return JSON.stringify(v);
}
</script>
