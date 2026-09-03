<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <span>Variables</span>
      <v-spacer />
      <v-btn
        prepend-icon="mdi-plus"
        @click="add"
      >
        Add
      </v-btn>
    </v-card-title>
    <v-card-text>
      <v-row
        v-for="v in local"
        :key="v.key"
        dense
        class="mb-1"
        align="center"
      >
        <v-col cols="auto">
          <v-checkbox-btn v-model="v.enabled" />
        </v-col>
        <v-col cols="3">
          <v-text-field
            v-model="v.key"
            placeholder="key"
            hide-details
          />
        </v-col>
        <v-col>
          <v-text-field
            v-model="v.value"
            placeholder="value"
            hide-details
          />
        </v-col>
        <v-col cols="auto">
          <v-btn
            icon="mdi-delete"
            @click="remove(v.key)"
          />
        </v-col>
      </v-row>
      <v-alert
        v-if="!local.length"
        type="info"
        variant="tonal"
      >
        No collection variables.
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { VariableEntry } from '@domain/variable/VariableScope';

const props = defineProps<{ modelValue: ReadonlyArray<VariableEntry> }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: VariableEntry[]): void }>();

const local = computed({
  get: () => props.modelValue.map((v) => ({ ...v })),
  set: (v) => emit('update:modelValue', v),
});

function add() {
  emit('update:modelValue', [...local.value, { key: '', value: '', enabled: true, secret: false }]);
}
function remove(key: string) {
  emit('update:modelValue', local.value.filter((v) => v.key !== key));
}
</script>