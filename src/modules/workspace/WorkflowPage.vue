<template>
  <v-container fluid v-if="workflow">
    <v-row>
      <v-col cols="12" class="d-flex align-center">
        <h2 class="text-h6 mb-0">{{ workflow.name }}</h2>
        <v-switch v-model="runTests" label="Run tests" inset class="mt-0 mb-0" density="compact" />
        <v-spacer />
        <v-btn
          color="primary"
          prepend-icon="mdi-play"
          :loading="running"
          :disabled="running"
          @click="runAll"
        >
          Run workflow
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>Steps ({{ workflow.steps.length }})</v-card-title>
          <v-card-text class="pa-0">
            <v-list density="compact">
              <v-list-item
                v-for="(step, i) in workflow.steps"
                :key="step.id"
                :title="`${i + 1}. ${stepName(step)}`"
              >
                <template v-slot:append>
                  <v-chip
                    :color="
                      stepResult(step)?.ok === true
                        ? 'success'
                        : stepResult(step)?.ok === false
                          ? 'error'
                          : 'grey'
                    "
                    size="small"
                  />
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="result">
      <v-col cols="12">
        <v-card>
          <v-card-title>Run results</v-card-title>
          <v-card-text>
            <v-chip :color="result.ok ? 'success' : 'error'" size="small">{{
              result.ok ? 'Passed' : 'Failed'
            }}</v-chip>
            <div class="mt-2" v-for="(step, i) in workflow.steps" :key="step.id">
              <div class="font-weight-medium">{{ i + 1 }}. {{ stepName(step) }}</div>
              <div v-if="stepResult(step)">
                <v-chip :color="stepResult(step)!.ok ? 'success' : 'error'" size="x-small">
                  {{ stepResult(step)!.ok ? 'OK' : 'FAILED' }}
                </v-chip>
                <span v-if="stepResult(step)!.status" class="text-caption ml-1"
                  >HTTP {{ stepResult(step)!.status }}</span
                >

                <div v-if="stepResult(step)!.requestBody" class="mt-1">
                  <div class="text-caption text-medium-emphasis">Request body</div>
                  <JsonCodeView :value="stepResult(step)!.requestBody" />
                </div>

                <div v-if="stepResult(step)!.responseBody" class="mt-1">
                  <div class="text-caption text-medium-emphasis">Response body</div>
                  <JsonCodeView :value="stepResult(step)!.responseBody" />
                </div>

                <v-list v-if="stepResult(step)!.tests?.length" density="compact">
                  <v-list-item
                    v-for="t in stepResult(step)!.tests"
                    :key="t.id"
                    :prepend-icon="testIcon(t.status)"
                    :title="t.name"
                  >
                    <template v-slot:subtitle>
                      <span :class="testClass(t.status)">{{ t.status }}</span>
                    </template>
                  </v-list-item>
                </v-list>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
  <v-alert v-else type="info" variant="tonal" density="compact">No workflow selected.</v-alert>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useExecutionStore } from '@stores/useExecutionStore';
import JsonCodeView from '@components/JsonCodeView.vue';
import type { WorkflowStep } from '@domain/workflow/Workflow';
import type { TestStatus } from '@domain/test/TestResult';

const route = useRoute();
const store = useCollectionStore();
const execution = useExecutionStore();

const runTests = ref(true);
const collection = computed(() => store.activeCollection);

const workflow = computed(
  () => collection.value?.workflows.find((w) => w.id === route.params.workflowId) ?? null,
);
const result = computed(() => execution.workflowResult);
const running = computed(() => execution.running);

function stepName(step: WorkflowStep): string {
  return store.requestById(step.requestId)?.name ?? step.requestId;
}

function stepResult(step: WorkflowStep) {
  return result.value?.steps.find((s) => s.stepId === step.id);
}

function testIcon(status: TestStatus): string {
  if (status === 'passed') return 'mdi-check-circle';
  if (status === 'failed') return 'mdi-alert';
  return 'mdi-minus';
}

function testClass(status: TestStatus): string {
  if (status === 'passed') return 'text-success';
  if (status === 'failed') return 'text-error';
  return 'text-grey';
}

async function runAll() {
  if (!workflow.value || !collection.value) return;
  await execution.runWorkflow(
    workflow.value,
    collection.value.requests,
    collection.value.variables,
    runTests.value,
  );
}
</script>
