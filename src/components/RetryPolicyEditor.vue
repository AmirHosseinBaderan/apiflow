<template>
  <div class="pa-2">
    <v-switch v-model="local.enabled" label="Enable retry" density="compact" hide-details />
    <v-row dense>
      <v-col cols="6"><v-text-field v-model.number="local.maxAttempts" label="Max attempts" type="number" density="compact" hide-details /></v-col>
      <v-col cols="6"><v-text-field v-model.number="local.initialDelayMs" label="Initial delay (ms)" type="number" density="compact" hide-details /></v-col>
    </v-row>
    <v-select v-model="local.backoff" :items="['fixed','exponential']" label="Backoff" density="compact" hide-details />
    <v-combobox v-model="local.retryOn" :items="['networkError','timeout','status5xx','statusCode']" label="Retry on" multiple chips density="compact" hide-details />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { RetryPolicyWithCodes } from '@domain/request/RequestDefinition';

const props = defineProps<{ modelValue: RetryPolicyWithCodes }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: RetryPolicyWithCodes): void }>();

const local = computed({
  get: () => ({ ...props.modelValue }),
  set: (v) => emit('update:modelValue', { ...v }),
});
</script>