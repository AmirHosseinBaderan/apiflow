<template>
  <v-container
    v-if="local"
    fluid
  >
    <v-row>
      <v-col
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model="local.name"
          :label="t('workflowTitle')"
          density="compact"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model="local.description"
          :label="t('workflowDescription')"
          density="compact"
          hide-details
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>{{ t('steps') }} ({{ local.steps.length }})</v-card-title>
          <v-card-text>
            <v-expansion-panels pop>
              <v-expansion-panel
                v-for="(step, i) in local.steps"
                :key="step.id"
                :title="`Step ${i + 1}`"
                :subtitle="stepName(step)"
              >
                <v-expansion-panel-text>
                  <v-autocomplete
                    v-model="step.requestId"
                    :items="requestOptions"
                    item-title="name"
                    item-value="id"
                    :label="t('request')"
                    density="compact"
                    hide-details
                    class="mt-2"
                    @update:model-value="onStepRequestChange(i, $event)"
                  />

                  <v-select
                    :model-value="condType(i)"
                    :items="condTypeItems"
                    :label="t('condition')"
                    density="compact"
                    hide-details
                    class="mt-2"
                    @update:model-value="(e: string) => setCondType(i, e)"
                  />
                  <v-text-field
                    v-if="condType(i) === 'statusEquals'"
                    :model-value="condValue(i)"
                    :label="t('expectedStatus')"
                    density="compact"
                    hide-details
                    class="mt-1"
                    @update:model-value="(e: string) => setCondValue(i, e)"
                  />
                  <div
                    v-else-if="condType(i) === 'variableEquals'"
                    class="d-flex mt-1"
                  >
                    <v-text-field
                      :model-value="condName(i)"
                      label="Variable name"
                      density="compact"
                      hide-details
                      @update:model-value="(e: string) => setCondName(i, e)"
                    />
                    <v-text-field
                      :model-value="condValue(i)"
                      label="Equals"
                      density="compact"
                      hide-details
                      class="ml-2"
                      @update:model-value="(e: string) => setCondValue(i, e)"
                    />
                  </div>

                  <div class="mt-2">
                    <div class="text-caption text-medium-emphasis mb-1">
                      {{ t('requestBody') }}
                    </div>
                    <v-textarea
                      :model-value="stepBody(i)"
                      :color="validStepBody(i) === false ? 'error' : undefined"
                      :rows="5"
                      density="compact"
                      hide-details
                      placeholder="Enter valid JSON"
                      @update:model-value="(e: string) => setStepBody(i, e)"
                    />
                  </div>

                  <div class="mt-2">
                    <div class="text-caption text-medium-emphasis mb-1">
                      {{ t('headers') }}
                    </div>
                    <v-row
                      v-for="(h, hi) in stepHeaders(i)"
                      :key="h.id"
                      dense
                      align="center"
                    >
                      <v-col cols="4">
                        <v-text-field
                          :model-value="h.key"
                          label="Name"
                          density="compact"
                          hide-details
                          @update:model-value="(e: string) => setStepHeaderField(i, hi, 'key', e)"
                        />
                      </v-col>
                      <v-col cols="7">
                        <v-text-field
                          :model-value="h.value"
                          label="Value"
                          density="compact"
                          hide-details
                          @update:model-value="(e: string) => setStepHeaderField(i, hi, 'value', e)"
                        />
                      </v-col>
                      <v-col cols="1">
                        <v-btn
                          icon="mdi-delete"
                          size="small"
                          variant="text"
                          color="error"
                          @click="removeStepHeader(i, hi)"
                        />
                      </v-col>
                    </v-row>
                    <v-btn
                      size="small"
                      variant="text"
                      prepend-icon="mdi-plus"
                      @click="addStepHeader(i)"
                    >
                      {{ t('addHeader') }}
                    </v-btn>
                  </div>
                  <v-divider class="my-1" />
                  <div class="d-flex justify-end">
                    <v-btn
                      icon="mdi-chevron-up"
                      size="small"
                      variant="text"
                      @click="moveUp(i)"
                    />
                    <v-btn
                      icon="mdi-chevron-down"
                      size="small"
                      variant="text"
                      @click="moveDown(i)"
                    />
                    <v-btn
                      icon="mdi-delete"
                      size="small"
                      variant="text"
                      color="error"
                      @click="removeStep(i)"
                    />
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <div class="d-flex align-center mt-2">
              <v-btn
                color="primary"
                prepend-icon="mdi-plus"
                @click="addStep"
              >
                Add step
              </v-btn>
              <v-spacer />
              <v-btn
                variant="outlined"
                @click="save"
              >
                {{ t('saveWorkflow') }}
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>{{ t('runWorkflow') }}</v-card-title>
          <v-card-text class="d-flex align-center">
            <v-switch
              v-model="runTests"
              :label="t('runTests')"
              inset
              class="mt-0 mb-0"
              density="compact"
            />
            <v-spacer />
            <v-btn
              color="primary"
              prepend-icon="mdi-play"
              :loading="running"
              :disabled="running"
              @click="runAll"
            >
              {{ t('runWorkflow') }}
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="result">
      <v-col cols="12">
        <v-card>
          <v-card-title>{{ t('passed') }} — {{ ranAt }}</v-card-title>
          <v-card-text>
            <v-chip
              :color="result.ok ? 'success' : 'error'"
              size="small"
            >
              {{
                result.ok ? t('passed') : t('failed')
              }}
            </v-chip>
            <div
              v-for="(step, i) in result.steps"
              :key="step.stepId"
              class="mt-2"
            >
              <div class="font-weight-medium">
                {{ i + 1 }}. {{ step.requestName }}
              </div>
              <div class="d-flex align-center mt-1">
                <v-chip
                  :color="step.ok ? 'success' : 'error'"
                  size="x-small"
                >
                  {{
                    step.ok ? t('ok') : t('failedStep')
                  }}
                </v-chip>
                <span
                  v-if="step.status"
                  class="text-caption ml-1"
                >HTTP {{ step.status }}</span>
                <span
                  v-if="step.error"
                  class="text-error text-caption ml-1"
                >{{ step.error }}</span>
              </div>
              <div
                v-if="step.requestBody"
                class="mt-1"
              >
                <div class="text-caption text-medium-emphasis">
                  {{ t('requestBody') }}
                </div>
                <JsonCodeView :value="step.requestBody" />
              </div>
              <div
                v-if="step.responseBody"
                class="mt-1"
              >
                <div class="text-caption text-medium-emphasis">
                  {{ t('responseBody') }}
                </div>
                <JsonCodeView :value="step.responseBody" />
              </div>
              <v-list
                v-if="step.tests?.length"
                density="compact"
              >
                <v-list-item
                  v-for="t in step.tests"
                  :key="t.id"
                  :prepend-icon="testIcon(t.status)"
                  :title="t.name"
                >
                  <template #subtitle>
                    <span :class="testClass(t.status)">{{ t.status }}</span>
                  </template>
                </v-list-item>
              </v-list>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
  <v-alert
    v-else
    type="info"
    variant="tonal"
    density="compact"
  >
    No workflow selected.
  </v-alert>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useExecutionStore } from '@stores/useExecutionStore';
import { useNotifier } from '@composables/useNotifier';
import JsonCodeView from '@components/JsonCodeView.vue';
import { buildStepFromRequest } from '@domain/workflow/Workflow';
import type {
  Workflow,
  WorkflowStep,
  WorkflowCondition,
  StepOverrides,
  VariableMapping,
} from '@domain/workflow/Workflow';
import type { KeyValue } from '@domain/request/RequestDefinition';
import type { TestStatus } from '@domain/test/TestResult';
import { createId } from '@shared/id';
import { useLocaleStore } from '@i18n/store';
import { toShamsi } from '@i18n/date';

const route = useRoute();
const store = useCollectionStore();
const execution = useExecutionStore();
const locale = useLocaleStore();
const { notify } = useNotifier();
const t = (key: string) => locale.t(key);

const runTests = ref(true);
const ranAt = ref('');
const collection = computed(() => store.activeCollection);
const result = computed(() => execution.workflowResult);
const running = computed(() => execution.running);

interface MutableStep extends Omit<WorkflowStep, 'variableMappings' | 'overrides'> {
  variableMappings: VariableMapping[];
  overrides?: StepOverrides;
}
interface MutableWorkflow {
  id: string;
  name: string;
  description?: string;
  steps: MutableStep[];
}

const local = ref<MutableWorkflow | null>(null);

watch(
  () => route.params.workflowId,
  (id) => {
    const wf = collection.value?.workflows.find((w) => w.id === id);
    local.value = wf ? JSON.parse(JSON.stringify(wf)) : null;
  },
  { immediate: true },
);

const requestOptions = computed(
  () => collection.value?.requests.map((r) => ({ id: r.id, name: r.name })) ?? [],
);
const condTypeItems = ['always', 'statusEquals', 'variableEquals'];

function stepName(step: WorkflowStep): string {
  return store.requestById(step.requestId)?.name ?? step.requestId;
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

function replaceSteps(steps: MutableStep[]) {
  local.value = {
    ...(local.value ?? { id: createId('wf'), name: '', steps: [] }),
    steps: [...steps],
  };
}

function stepBody(i: number): string {
  const step = local.value?.steps[i];
  if (!step) return '';
  if (step.overrides?.body !== undefined) return step.overrides.body;
  const req = store.requestById(step.requestId);
  return req && req.body.type === 'json' ? req.body.content : '';
}

function setStepBody(i: number, value: string) {
  const step = local.value!.steps[i]!;
  const req = store.requestById(step.requestId);
  const baseHeaders = req ? [...req.headers] : [];
  const overrides: StepOverrides = {
    pathParams: step.overrides?.pathParams,
    queryParams: step.overrides?.queryParams,
    headers: step.overrides?.headers ?? baseHeaders,
    body: value,
  };
  local.value!.steps[i] = { ...step, overrides };
  replaceSteps(local.value!.steps);
}

function stepHeaders(i: number): KeyValue[] {
  const step = local.value?.steps[i];
  if (!step) return [];
  return [...(step.overrides?.headers ?? store.requestById(step.requestId)?.headers ?? [])];
}

function setStepHeaders(i: number, headers: KeyValue[]) {
  const step = local.value!.steps[i]!;
  const body = step.overrides?.body ?? stepBody(i);
  local.value!.steps[i] = {
    ...step,
    overrides: {
      pathParams: step.overrides?.pathParams,
      queryParams: step.overrides?.queryParams,
      headers,
      body,
    },
  };
  replaceSteps(local.value!.steps);
}

function setStepHeaderField(i: number, hi: number, field: 'key' | 'value', value: string) {
  const headers = stepHeaders(i);
  headers[hi] = { ...headers[hi]!, [field]: value };
  setStepHeaders(i, headers);
}

function addStepHeader(i: number) {
  const headers = stepHeaders(i);
  headers.push({ id: createId('kv'), key: '', value: '', enabled: true });
  setStepHeaders(i, headers);
}

function removeStepHeader(i: number, hi: number) {
  const headers = stepHeaders(i);
  headers.splice(hi, 1);
  setStepHeaders(i, headers);
}

function validStepBody(i: number): boolean | null {
  const v = stepBody(i);
  if (!v) return null;
  try {
    JSON.parse(v);
    return true;
  } catch {
    return false;
  }
}

function condType(i: number): string {
  const cond = local.value?.steps[i]?.condition;
  return cond ? cond.type : 'always';
}

function condValue(i: number): string {
  const cond = local.value?.steps[i]?.condition;
  if (!cond) return '';
  if (cond.type === 'statusEquals') return String(cond.value);
  if (cond.type === 'variableEquals') return cond.value;
  return '';
}

function condName(i: number): string {
  const cond = local.value?.steps[i]?.condition;
  if (cond && cond.type === 'variableEquals') return cond.name;
  return '';
}

function stepMutate(i: number, patch: Partial<MutableStep>) {
  const step = local.value!.steps[i]!;
  local.value!.steps[i] = { ...step, ...patch };
  replaceSteps(local.value!.steps);
}

function setCondType(i: number, type: string) {
  let cond: WorkflowCondition | undefined;
  if (type === 'statusEquals') cond = { type: 'statusEquals', value: 200 };
  else if (type === 'variableEquals') cond = { type: 'variableEquals', name: '', value: '' };
  stepMutate(i, { condition: cond });
}

function setCondValue(i: number, value: string) {
  const cond = local.value?.steps[i]?.condition;
  if (!cond) {
    setCondType(i, 'statusEquals');
    return;
  }
  if (cond.type === 'statusEquals')
    stepMutate(i, { condition: { ...cond, value: Number(value) || 0 } });
  else if (cond.type === 'variableEquals') stepMutate(i, { condition: { ...cond, value } });
}

function setCondName(i: number, name: string) {
  const cond = local.value?.steps[i]?.condition;
  if (cond && cond.type === 'variableEquals') stepMutate(i, { condition: { ...cond, name } });
}

function onStepRequestChange(i: number, requestId: string | null) {
  const step = local.value!.steps[i]!;
  const req = requestId ? store.requestById(requestId) : null;
  local.value!.steps[i] = {
    ...step,
    requestId: requestId ?? step.requestId,
    overrides: req ? buildStepFromRequest(req).overrides! : step.overrides,
  };
  replaceSteps(local.value!.steps);
}

function addStep() {
  const requests = collection.value?.requests ?? [];
  const first = requests[0];
  if (!first) {
    notify('No requests in collection', 'warning');
    return;
  }
  const step = { ...buildStepFromRequest(first), id: createId('s') } as MutableStep;
  replaceSteps([...(local.value?.steps ?? []), step]);
}

function removeStep(i: number) {
  const steps = local.value?.steps.filter((_, idx) => idx !== i) ?? [];
  if (steps.length)
    steps[steps.length - 1] = { ...steps[steps.length - 1]!, next: { type: 'end' } };
  replaceSteps(steps);
}

function moveUp(i: number) {
  const steps = local.value?.steps ?? [];
  if (i <= 0) return;
  const arr = [...steps];
  [arr[i - 1], arr[i]] = [arr[i]!, arr[i - 1]!];
  replaceSteps(arr);
}

function moveDown(i: number) {
  const steps = local.value?.steps ?? [];
  if (i >= steps.length - 1) return;
  const arr = [...steps];
  [arr[i], arr[i + 1]] = [arr[i + 1]!, arr[i]!];
  replaceSteps(arr);
}

function finalizeSteps(steps: WorkflowStep[]): WorkflowStep[] {
  const arr = [...steps];
  for (let i = 0; i < arr.length; i++) {
    const isLast = i === arr.length - 1;
    arr[i] = { ...arr[i]!, next: isLast ? { type: 'end' } : { type: 'next' } };
  }
  return arr;
}

async function save() {
  if (!local.value || !local.value.name) {
    notify('Give the workflow a title', 'warning');
    return;
  }
  const wf: Workflow = {
    id: local.value.id,
    name: local.value.name,
    description: local.value.description || undefined,
    steps: finalizeSteps(local.value.steps),
  };
  await store.saveWorkflows([
    ...(collection.value?.workflows.filter((w) => w.id !== wf.id) ?? []),
    wf,
  ]);
  notify('Workflow saved', 'success');
  local.value = JSON.parse(JSON.stringify(wf)) as MutableWorkflow;
}

async function runAll() {
  if (!local.value || !collection.value || local.value.steps.length < 1) return;
  ranAt.value = toShamsi(new Date());
  const res = await execution.runWorkflow(
    local.value,
    collection.value.requests,
    collection.value.variables,
    runTests.value,
  );
  if (res?.ok && Object.keys(res.collectionVariables).length > 0) {
    await store.mergeCollectionVariables(res.collectionVariables);
  }
}
</script>
