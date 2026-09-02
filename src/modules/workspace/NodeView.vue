<template>
  <v-row>
    <v-col cols="12" v-if="!activeCollection">
      <v-alert type="info" variant="tonal" density="compact">
        Select a collection to view its contents and run a workflow.
      </v-alert>
    </v-col>

    <template v-else>
      <v-col cols="12">
        <div class="d-flex align-center mb-2">
          <span class="text-h6">{{ node?.name ?? activeCollection.name }}</span>
          <v-chip v-if="node?.kind === 'folder'" size="small" class="ml-2">Folder</v-chip>
          <v-chip v-else size="small" class="ml-2">Collection</v-chip>
          <v-spacer />
          <v-btn
            v-if="node?.kind === 'folder'"
            color="primary"
            size="small"
            text="Back to collection"
            @click="gotoCollection"
          />
        </div>
      </v-col>

      <v-col cols="12">
        <v-card>
          <v-card-title>Items</v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item
                v-for="sub in node?.children ?? []"
                :key="sub.id"
                :title="sub.name"
                :value="sub.id"
                @click="openNode(sub)"
              >
                <template #prepend>
                  <v-icon :icon="iconFor(sub.kind)" size="small" />
                </template>
                <template #append v-if="sub.kind === 'folder'">
                  <v-icon icon="mdi-chevron-right" size="small" />
                </template>
              </v-list-item>
              <v-list-item v-if="(node?.children ?? []).length === 0" title="Empty" value="" />
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" v-if="node?.kind === 'collection'">
        <v-card>
          <v-card-title>Collection details</v-card-title>
          <v-card-text>
            <div class="text-h6">{{ node?.name }}</div>
            <div v-if="activeCollection?.description" class="text-body-2 text-medium-emphasis mt-1">
              {{ activeCollection?.description }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              Updated {{ activeCollection?.updatedAt }}
            </div>
            <div v-if="activeCollection?.variables.length" class="mt-2">
              <div class="text-caption text-medium-emphasis">Variables</div>
              <v-list density="compact" class="py-0">
                <v-list-item
                  v-for="v in activeCollection?.variables"
                  :key="v.key"
                  :title="v.key"
                  :subtitle="v.value"
                  density="compact"
                />
              </v-list>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" v-if="node?.kind === 'collection'">
        <v-card>
          <v-card-title>Workflow</v-card-title>
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
              density="compact"
              hide-details
              class="mt-2"
            />
            <v-text-field
              v-if="conditionType !== 'always'"
              v-model="conditionValue"
              :label="conditionType === 'statusEquals' ? 'Expected status' : 'Variable value'"
              density="compact"
              hide-details
              class="mt-1"
            />

            <template v-if="workflowRequestIds.length > 0">
              <div v-for="(reqId, idx) in workflowRequestIds" :key="reqId" class="mt-3">
                <div class="text-subtitle-2">
                  Step {{ idx + 1 }}: {{ requestNameById(reqId) ?? reqId }}
                </div>
                <v-card variant="outlined" class="pa-2">
                  <div class="text-caption mb-1">
                    Parameters (map a variable into a request variable)
                  </div>
                  <v-row v-for="(m, mi) in stepMappings[idx] ?? []" :key="mi" dense align="center">
                    <v-col cols="3">
                      <v-text-field
                        v-model="m.fromVar"
                        label="From variable"
                        density="compact"
                        hide-details
                      />
                    </v-col>
                    <v-col cols="3">
                      <v-text-field
                        v-model="m.toVar"
                        label="To variable"
                        density="compact"
                        hide-details
                      />
                    </v-col>
                    <v-col cols="3">
                      <v-select
                        v-model="m.transform"
                        :items="[null, 'trim', 'lower', 'upper', 'number']"
                        label="Transform"
                        density="compact"
                        hide-details
                      />
                    </v-col>
                    <v-col cols="3" cols-sm="auto">
                      <v-btn
                        icon="mdi-delete"
                        size="small"
                        variant="text"
                        @click="removeMapping(idx, mi)"
                      />
                    </v-col>
                  </v-row>
                  <v-btn
                    size="small"
                    variant="text"
                    prepend-icon="mdi-plus"
                    @click="addMapping(idx)"
                    >Add parameter</v-btn
                  >
                </v-card>
              </div>
            </template>

            <v-text-field
              v-model="workflowName"
              label="Workflow name"
              density="compact"
              hide-details
              class="mt-2"
            />
            <div class="d-flex align-center mt-2">
              <v-btn
                class="mt-3"
                color="primary"
                :disabled="workflowRequestIds.length < 2"
                @click="runWorkflow"
              >
                Run workflow
              </v-btn>
              <v-btn
                class="mt-3 ml-2"
                variant="tonal"
                :disabled="workflowRequestIds.length < 2"
                @click="saveWorkflow"
              >
                Save workflow
              </v-btn>
            </div>

            <v-card v-if="lastWorkflow" variant="tonal" class="mt-3">
              <v-card-title>Result</v-card-title>
              <v-card-text>
                <v-alert :type="lastWorkflow.ok ? 'success' : 'error'" variant="tonal">
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
                      <v-icon :color="s.ok ? 'success' : 'error'">{{
                        s.ok ? 'mdi-check' : 'mdi-close'
                      }}</v-icon>
                    </template>
                    <v-list-item-title>{{ s.requestName }}</v-list-item-title>
                    <v-list-item-subtitle v-if="s.error">{{ s.error }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item v-if="s.requestBody !== undefined" class="pl-8">
                    <v-list-item-title class="text-caption">Request JSON</v-list-item-title>
                    <JsonCodeView :value="s.requestBody" />
                  </v-list-item>
                  <v-list-item v-if="s.responseBody !== undefined" class="pl-8">
                    <v-list-item-title class="text-caption">Response</v-list-item-title>
                    <JsonCodeView :value="parseBody(s.responseContentType, s.responseBody)" />
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-card-text>
        </v-card>

        <v-card v-if="savedWorkflows.length" variant="outlined" class="mt-3">
          <v-card-title>Saved workflows</v-card-title>
          <v-card-text class="pa-0">
            <v-list density="compact">
              <v-list-item
                v-for="wf in savedWorkflows"
                :key="wf.id"
                :title="wf.name"
                :subtitle="`${wf.steps.length} steps`"
              >
                <template v-slot:append>
                  <v-btn
                    icon="mdi-open-in-new"
                    size="small"
                    variant="text"
                    @click="gotoWorkflow(wf)"
                  />
                </template>
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
import { useRouter, useRoute } from 'vue-router';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useNotifier } from '@composables/useNotifier';
import { httpClient } from '@application/requests/httpClientPort';
import { RequestExecutionService } from '@application/requests/RequestExecutionService';
import { WorkflowEngine } from '@application/workflows/WorkflowEngine';
import { buildLinearWorkflowFromRequests, type VariableMapping } from '@domain/workflow/Workflow';
import type { Workflow, WorkflowExecutionResult } from '@domain/workflow/Workflow';
import type { CollectionTreeNode } from '@stores/useCollectionStore';
import JsonCodeView from '@components/JsonCodeView.vue';
import { createId } from '@shared/id';

const store = useCollectionStore();
const router = useRouter();
const route = useRoute();
const { notify } = useNotifier();

const activeCollection = computed(() => store.activeCollection);
const folderId = computed(() => route.params.folderId as string | undefined);

const node = computed(() => store.activeTreeNode(folderId.value ?? null));

const availableRequests = computed(() => activeCollection.value?.requests ?? []);
const requestById = (id: string) => availableRequests.value.find((r) => r.id === id);

const workflowName = ref('Untitled workflow');
const workflowRequestIds = ref<string[]>([]);
const conditionType = ref<'always' | 'statusEquals' | 'variableEquals'>('always');
const conditionValue = ref('200');
const stepMappings = ref<VariableMapping[][]>([]);
const lastWorkflow = ref<WorkflowExecutionResult | null>(null);
const savedWorkflows = computed(() => activeCollection.value?.workflows ?? []);

function buildWorkflow(): Workflow {
  const requests = workflowRequestIds.value
    .map((id) => requestById(id))
    .filter((r): r is NonNullable<ReturnType<typeof requestById>> => Boolean(r));
  const cond = buildCondition();
  const baseSteps = buildLinearWorkflowFromRequests(requests);
  const steps = baseSteps.map((s, idx) => ({
    ...s,
    condition: idx === 0 ? cond : { type: 'always' as const },
    variableMappings: stepMappings.value[idx] ?? [],
  }));
  return { id: createId('wf'), name: workflowName.value || 'Untitled workflow', steps };
}

function gotoWorkflow(wf: { id: string }) {
  const cid = activeCollection.value?.id;
  if (cid) router.push({ name: 'workflow', params: { collectionId: cid, workflowId: wf.id } });
}

function requestNameById(id: string): string | undefined {
  return requestById(id)?.name;
}

function iconFor(kind: CollectionTreeNode['kind']) {
  if (kind === 'request') return 'mdi-file-document';
  return 'mdi-folder';
}

function openNode(item: CollectionTreeNode) {
  const cid = activeCollection.value?.id;
  if (!cid) return;
  if (item.kind === 'folder')
    router.push({ name: 'node', params: { collectionId: cid, folderId: item.id } });
  else if (item.kind === 'request')
    router.push({ name: 'request', params: { collectionId: cid, requestId: item.id } });
}

function gotoCollection() {
  const cid = activeCollection.value?.id;
  if (cid) router.push({ name: 'collection', params: { collectionId: cid } });
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
  if (conditionType.value === 'statusEquals')
    return { type: 'statusEquals' as const, value: Number(conditionValue.value) || 200 };
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
    .filter((r): r is NonNullable<ReturnType<typeof requestById>> => Boolean(r));
  const engine = new WorkflowEngine(new RequestExecutionService(httpClient()));
  lastWorkflow.value = await engine.run({
    workflow: buildWorkflow(),
    requests,
    initialBundle: { collection: collection.variables, request: [], runtime: [] },
  });
  notify(
    lastWorkflow.value.ok ? 'Workflow passed' : 'Workflow failed',
    lastWorkflow.value.ok ? 'success' : 'error',
  );
}

async function saveWorkflow() {
  const wf = buildWorkflow();
  if (!workflowRequestIds.value.length) {
    notify('Add requests to the workflow first', 'warning');
    return;
  }
  await store.saveWorkflows([...(activeCollection.value?.workflows ?? []), wf]);
  notify('Workflow saved', 'success');
}

function parseBody(contentType: string | undefined, body: string): unknown {
  if (!body) return body;
  if ((contentType ?? '').toLowerCase().includes('json')) {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  return body;
}
</script>
