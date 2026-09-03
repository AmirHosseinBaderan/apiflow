<template>
  <v-row>
    <v-col
      v-if="!activeCollection"
      cols="12"
    >
      <v-alert
        type="info"
        variant="tonal"
        density="compact"
      >
        Select a collection to view its workflow.
      </v-alert>
    </v-col>
    <template v-else>
      <v-col cols="12">
        <v-card>
          <v-card-title>{{ activeCollection.name }} — workflow</v-card-title>
          <v-card-text>
            <v-select
              v-model="workflowRequestIds"
              :items="availableRequests"
              item-title="name"
              item-value="id"
              label="Pick requests to chain (in order)"
              multiple
              chips
            />

            <v-select
              v-model="conditionType"
              :items="['always', 'statusEquals', 'variableEquals']"
              label="Condition for first step"
              hide-details
              class="mt-2"
            />
            <v-text-field
              v-if="conditionType !== 'always'"
              v-model="conditionValue"
              :label="conditionType === 'statusEquals' ? 'Expected status' : 'Variable value'"
              hide-details
              class="mt-1"
            />

            <template v-if="workflowRequestIds.length > 0">
              <div
                v-for="(reqId, idx) in workflowRequestIds"
                :key="reqId"
                class="mt-3"
              >
                <div class="text-subtitle-2">
                  Step {{ idx + 1 }}: {{ requestNameById(reqId) ?? reqId }}
                </div>
                <v-card
                  variant="outlined"
                  class="pa-2"
                >
                  <div class="text-caption mb-1">
                    Parameters (map a variable into a request variable)
                  </div>
                  <v-row
                    v-for="(m, mi) in stepMappings[idx] ?? []"
                    :key="mi"
                    dense
                    align="center"
                  >
                    <v-col cols="4">
                      <v-text-field
                        v-model="m.fromVar"
                        label="From variable"
                        placeholder="collection/runtime variable"
                        hide-details
                      />
                    </v-col>
                    <v-col cols="4">
                      <v-text-field
                        v-model="m.toVar"
                        label="To variable"
                        hide-details
                      />
                    </v-col>
                    <v-col cols="3">
                      <v-select
                        v-model="m.transform"
                        :items="[null, 'trim', 'lower', 'upper', 'number']"
                        label="Transform"
                        hide-details
                      />
                    </v-col>
                    <v-col
                      cols="1"
                      cols-sm="auto"
                    >
                      <v-btn
                        rounded="lg"
                        icon="mdi-delete"
                        @click="removeMapping(idx, mi)"
                      />
                    </v-col>
                  </v-row>
                  <v-btn
                    rounded="lg"
                    prepend-icon="mdi-plus"
                    variant="text"
                    size="small"
                    @click="addMapping(idx)"
                  >
                    Add parameter
                  </v-btn>
                </v-card>
              </div>
            </template>

            <v-btn
              rounded="lg"
              class="mt-3"
              color="primary"
              :disabled="workflowRequestIds.length < 2"
              @click="runWorkflow"
            >
              Run workflow
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12">
        <v-card
          v-if="lastWorkflow"
          variant="tonal"
        >
          <v-card-title>Workflow result</v-card-title>
          <v-card-text>
            <v-alert
              :type="lastWorkflow.ok ? 'success' : 'error'"
              variant="tonal"
            >
              {{ lastWorkflow.ok ? 'Workflow passed' : 'Workflow failed' }}
            </v-alert>
            <v-list
              v-for="s in lastWorkflow.steps"
              :key="s.stepId"
              density="compact"
              class="mt-2"
            >
              <v-list-item>
                <template #prepend>
                  <v-icon :color="s.ok ? 'success' : 'error'">
                    {{
                      s.ok ? 'mdi-check' : 'mdi-close'
                    }}
                  </v-icon>
                </template>
                <v-list-item-title>{{ s.requestName }}</v-list-item-title>
                <v-list-item-subtitle v-if="s.error">
                  {{ s.error }}
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item
                v-if="s.requestBody !== undefined"
                class="pl-8"
              >
                <v-list-item-title class="text-caption">
                  Request JSON
                </v-list-item-title>
                <JsonCodeView :value="s.requestBody" />
              </v-list-item>
              <v-list-item
                v-if="s.responseBody !== undefined"
                class="pl-8"
              >
                <v-list-item-title class="text-caption">
                  Response
                </v-list-item-title>
                <JsonCodeView :value="parseBody(s.responseContentType, s.responseBody)" />
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </template>
  </v-row>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useNotifier } from '@composables/useNotifier';
import { httpClient } from '@application/requests/httpClientPort';
import { RequestExecutionService } from '@application/requests/RequestExecutionService';
import { WorkflowEngine } from '@application/workflows/WorkflowEngine';
import {
  buildLinearWorkflowFromRequests,
  type WorkflowExecutionResult,
  type VariableMapping,
} from '@domain/workflow/Workflow';
import type { RequestDefinition } from '@domain/request/RequestDefinition';
import JsonCodeView from '@components/JsonCodeView.vue';

const store = useCollectionStore();
const { notify } = useNotifier();

const activeCollection = computed(() => store.activeCollection);
const availableRequests = computed(() => activeCollection.value?.requests ?? []);
const requestById = (id: string) => availableRequests.value.find((r) => r.id === id);

const workflowRequestIds = ref<string[]>([]);
const conditionType = ref<'always' | 'statusEquals' | 'variableEquals'>('always');
const conditionValue = ref('200');
const stepMappings = ref<VariableMapping[][]>([]);
const lastWorkflow = ref<WorkflowExecutionResult | null>(null);

function requestNameById(id: string): string | undefined {
  return requestById(id)?.name;
}

function addMapping(stepIndex: number) {
  const arr = stepMappings.value[stepIndex] ?? [];
  arr.push({ fromVar: '', toVar: '', transform: undefined });
  stepMappings.value[stepIndex] = arr;
}

function removeMapping(stepIndex: number, mappingIndex: number) {
  const arr = stepMappings.value[stepIndex] ?? [];
  arr.splice(mappingIndex, 1);
  stepMappings.value[stepIndex] = arr;
}

watch(workflowRequestIds, (ids) => {
  stepMappings.value = ids.map((_, i) => stepMappings.value[i] ?? []);
});

function buildCondition() {
  if (conditionType.value === 'statusEquals') {
    return { type: 'statusEquals' as const, value: Number(conditionValue.value) || 200 };
  }
  if (conditionType.value === 'variableEquals') {
    const [name, ...rest] = conditionValue.value.split('=');
    return {
      type: 'variableEquals' as const,
      name: name?.trim() ?? '',
      value: rest.join('=').trim(),
    };
  }
  return { type: 'always' as const };
}

async function runWorkflow() {
  const collection = activeCollection.value;
  if (!collection || workflowRequestIds.value.length < 2) return;
  const requests = workflowRequestIds.value
    .map((id) => requestById(id))
    .filter((r): r is RequestDefinition => Boolean(r));
  const cond = buildCondition();
  const baseSteps = buildLinearWorkflowFromRequests(requests);
  const steps = baseSteps.map((s, idx) => ({
    ...s,
    condition: idx === 0 ? cond : { type: 'always' as const },
    variableMappings: stepMappings.value[idx] ?? [],
  }));
  const engine = new WorkflowEngine(new RequestExecutionService(httpClient()));
  lastWorkflow.value = await engine.run({
    workflow: { id: 'wf', name: 'Run', steps },
    requests,
    initialBundle: { collection: collection.variables, request: [], runtime: [] },
  });
  notify(
    lastWorkflow.value.ok ? 'Workflow passed' : 'Workflow failed',
    lastWorkflow.value.ok ? 'success' : 'error',
  );
}

function parseBody(contentType: string | undefined, body: string): unknown {
  if (!body) return body;
  const t = (contentType ?? '').toLowerCase();
  if (t.includes('json')) {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  return body;
}
</script>
