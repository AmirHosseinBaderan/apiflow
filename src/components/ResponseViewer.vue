<template>
  <v-card>
    <v-tabs
      v-model="tab"
      color="primary"
      density="comfortable"
    >
      <v-tab value="body">
        Body
      </v-tab>
      <v-tab value="headers">
        Headers
      </v-tab>
    </v-tabs>
    <v-card-text>
      <v-tabs-window v-model="tab">
        <v-tabs-window-item value="body">
          <pre class="response-body">{{ response?.bodyText ?? '(no body)' }}</pre>
        </v-tabs-window-item>
        <v-tabs-window-item value="headers">
          <v-table density="compact">
            <thead>
              <tr><th>Name</th><th>Value</th></tr>
            </thead>
            <tbody>
              <tr
                v-for="[k, v] in response?.headers ?? []"
                :key="k"
              >
                <td>{{ k }}</td><td>{{ v }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { ExecutionResponse } from '@domain/test/TestResult';

defineProps<{ response: ExecutionResponse | undefined }>();
const tab = ref<'body' | 'headers'>('body');
</script>

<style scoped>
.response-body {
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 400px;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
}
</style>