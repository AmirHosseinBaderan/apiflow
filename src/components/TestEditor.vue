<template>
  <div>
    <v-row
      v-for="t in local"
      :key="t.id"
      dense
      class="mb-1"
      align="center"
    >
      <v-col cols="3">
        <v-text-field
          v-model="t.name"
          placeholder="name"
          hide-details
        />
      </v-col>
      <v-col cols="3">
        <v-select
          v-model="t.kind.type"
          :items="kinds"
          label="kind"
          hide-details
          @update:model-value="onKindChange(t.id, $event)"
        />
      </v-col>
      <v-col
        v-if="t.kind.type === 'script'"
        cols="12"
      >
        <CodeEditor
          v-model="t.kind.source"
          lang="js"
          placeholder="return response.status === 200"
          class="js-script-editor"
        />
      </v-col>
      <v-col v-else>
        <v-text-field
          v-model="t.expression"
          placeholder="expression / path / value"
          hide-details
        />
      </v-col>
      <v-col cols="auto">
        <v-btn
          icon="mdi-delete"
          @click="remove(t.id)"
        />
      </v-col>
    </v-row>
    <v-btn
      prepend-icon="mdi-plus"
      @click="add"
    >
      Add test
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import CodeEditor from '@components/CodeEditor.vue';
import type { TestStep, TestKind } from '@domain/request/RequestDefinition';
import { createId } from '@shared/id';

const props = defineProps<{ modelValue: ReadonlyArray<TestStep> }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: TestStep[]): void }>();

const kinds = ['statusEquals', 'bodyExists', 'durationLessThan', 'script'];

const local = computed({
  get: () => props.modelValue as TestStep[],
  set: (v) => emit('update:modelValue', v as TestStep[]),
});

function add() {
  const step: TestStep = {
    id: createId('tst'),
    name: 'Status is 200',
    kind: { type: 'statusEquals', value: 200 },
    expression: '200',
  };
  emit('update:modelValue', [...props.modelValue, step]);
}

function remove(id: string) {
  emit(
    'update:modelValue',
    props.modelValue.filter((t) => t.id !== id),
  );
}

function onKindChange(id: string, type: string) {
  const next = props.modelValue.map((t) => {
    if (t.id !== id) return t;
    let kind: TestKind;
    switch (type) {
      case 'statusEquals':
        kind = { type: 'statusEquals', value: 200 };
        break;
      case 'bodyExists':
        kind = { type: 'bodyExists', path: '' };
        break;
      case 'durationLessThan':
        kind = { type: 'durationLessThan', valueMs: 1000 };
        break;
      case 'script':
        kind = { type: 'script', source: 'return response.status === 200' };
        break;
      default:
        kind = { type: 'statusEquals', value: 200 };
    }
    return { ...t, kind };
  });
  emit('update:modelValue', next as TestStep[]);
}
</script>
