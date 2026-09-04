<template>
  <div class="pa-2">
    <v-switch
      v-model="local.enabled"
      :label="t('enableRetry')"
      hide-details
    />
    <v-row dense>
      <v-col cols="6">
        <v-text-field
          v-model.number="local.maxAttempts"
          :label="t('maxAttempts')"
          type="number"
          hide-details
        />
      </v-col>
      <v-col cols="6">
        <v-text-field
          v-model.number="local.initialDelayMs"
          :label="t('initialDelay')"
          type="number"
          hide-details
        />
      </v-col>
    </v-row>
    <v-select
      v-model="local.backoff"
      :items="['fixed','exponential']"
      :label="t('backoff')"
      hide-details
    />
    <v-combobox
      v-model="local.retryOn"
      :items="['networkError','timeout','status5xx','statusCode']"
      :label="t('retryOn')"
      multiple
      chips
      hide-details
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLocaleStore } from '@i18n/store';
import type { RetryPolicyWithCodes, RetryCondition } from '@domain/request/RequestDefinition';

const locale = useLocaleStore();
const t = (key: string) => locale.t(key);

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
