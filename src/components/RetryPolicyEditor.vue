<template>
  <div class="pa-2">
    <v-switch
      v-model="local.enabled"
      label="Enable retry"
      hide-details
    />
    <v-row dense>
      <v-col cols="6">
        <v-text-field
          v-model.number="local.maxAttempts"
          label="Max attempts"
          type="number"
          hide-details
        />
      </v-col>
      <v-col cols="6">
        <v-text-field
          v-model.number="local.initialDelayMs"
          label="Initial delay (ms)"
          type="number"
          hide-details
        />
      </v-col>
    </v-row>
    <v-select
      v-model="local.backoff"
      :items="['fixed','exponential']"
      label="Backoff"
      hide-details
    />
    <v-combobox
      v-model="local.retryOn"
      :items="['networkError','timeout','status5xx','statusCode']"
      label="Retry on"
      multiple
      chips
      hide-details
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { RetryPolicyWithCodes, RetryCondition } from '@domain/request/RequestDefinition';

interface WritableRetry {
  enabled: boolean;
  maxAttempts: number;
  initialDelayMs: number;
  backoff: 'fixed' | 'exponential';
  retryOn: RetryCondition[];
  retryStatusCodes: number[];
}

const props = defineProps<{ modelValue: RetryPolicyWithCodes }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: RetryPolicyWithCodes): void }>();

const local = computed<WritableRetry>({
  get: () => ({
    enabled: props.modelValue.enabled,
    maxAttempts: props.modelValue.maxAttempts,
    initialDelayMs: props.modelValue.initialDelayMs,
    backoff: props.modelValue.backoff,
    retryOn: [...props.modelValue.retryOn],
    retryStatusCodes: [...props.modelValue.retryStatusCodes],
  }),
  set: (v) => emit('update:modelValue', v),
});
</script>
