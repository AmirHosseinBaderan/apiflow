<template>
  <v-layout class="rounded rounded-md">
    <WorkspaceHeader
      :active-collection="activeCollection"
      @create="onCreate"
      @import="onImport"
      @export="onExport"
    />
    <CollectionsSidebar />
    <v-main>
      <v-container fluid>
        <v-row v-if="!activeRequest">
          <v-col cols="12">
            <v-card>
              <v-card-title>Welcome</v-card-title>
              <v-card-text>
                <p>Select or create a request to begin.</p>
                <v-row dense>
                  <v-col cols="12" md="6">
                    <v-card variant="outlined">
                      <v-card-title class="text-subtitle-1">OpenAPI Import</v-card-title>
                      <v-card-text>
                        <v-text-field v-model="openApiUrl" label="OpenAPI URL" placeholder="https://example.com/swagger.json" />
                        <v-btn color="primary" :disabled="!openApiUrl" @click="importOpenApi">Import from URL</v-btn>
                        <v-btn class="ml-2" variant="tonal" @click="triggerOpenApiFile">From File</v-btn>
                        <input ref="openApiInput" type="file" accept=".json,.yaml,.yml" hidden @change="onOpenApiFile" />
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-card variant="outlined">
                      <v-card-title class="text-subtitle-1">Workflow</v-card-title>
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
                          v-model="workflowConditionType"
                          :items="['always','statusEquals','variableEquals']"
                          label="Condition between steps"
                          density="compact"
                          hide-details
                          class="mt-2"
                        />
                        <v-text-field
                          v-if="workflowConditionType !== 'always'"
                          v-model="workflowConditionValue"
                          :label="workflowConditionType === 'statusEquals' ? 'Expected status' : 'Variable value'"
                          density="compact"
                          hide-details
                          class="mt-1"
                        />
                        <v-btn class="mt-3" color="primary" :disabled="workflowRequestIds.length < 2" @click="runWorkflow">Run Workflow</v-btn>
                        <v-list v-if="lastWorkflow" density="compact" class="mt-2">
                          <v-list-item v-for="s in lastWorkflow.steps" :key="s.stepId">
                            <template #prepend>
                              <v-icon :color="s.ok ? 'success' : 'error'">{{ s.ok ? 'mdi-check' : 'mdi-close' }}</v-icon>
                            </template>
                            <v-list-item-title>{{ s.requestName }}</v-list-item-title>
                            <v-list-item-subtitle v-if="s.error">{{ s.error }}</v-list-item-subtitle>
                          </v-list-item>
                        </v-list>
                        <v-alert v-if="lastWorkflow" :type="lastWorkflow.ok ? 'success' : 'error'" variant="tonal" class="mt-2">
                          {{ lastWorkflow.ok ? 'Workflow passed' : 'Workflow failed' }}
                        </v-alert>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-row v-else>
          <v-col cols="12">
            <RequestEditor :request="activeRequest" @update:request="onUpdateRequest" />
          </v-col>
          <v-col cols="12">
            <VariablesEditor :model-value="activeCollection?.variables ?? []" @update:model-value="onVariablesChange" />
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <v-dialog v-model="importDialog" max-width="500">
      <v-card>
        <v-card-title>Import Collection JSON</v-card-title>
        <v-card-text>
          <v-textarea v-model="importText" rows="10" placeholder="Paste collection JSON here" />
          <v-alert v-if="importError" type="error" variant="tonal">{{ importError }}</v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="importDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="confirmImport">Import</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue';
import WorkspaceHeader from './WorkspaceHeader.vue';
import CollectionsSidebar from './CollectionsSidebar.vue';
import RequestEditor from './RequestEditor.vue';
import VariablesEditor from '@components/VariablesEditor.vue';
import { useCollectionStore } from '@stores/useCollectionStore';
import { CollectionImporter, CollectionExporter } from '@application/imports/CollectionExchange';
import { collectionRepository } from '@application/collections/collectionRepositoryPort';
import { useNotifier } from '@composables/useNotifier';
import { WorkflowEngine } from '@application/workflows/WorkflowEngine';
import { RequestExecutionService } from '@application/requests/RequestExecutionService';
import { httpClient } from '@application/requests/httpClientPort';
import { ServicesKey } from '@app/providers/injectKeys';
import type { RequestDefinition } from '@domain/request/RequestDefinition';
import type { VariableEntry } from '@domain/variable/VariableScope';
import { buildLinearWorkflowFromRequests } from '@domain/workflow/Workflow';
import type { WorkflowExecutionResult } from '@domain/workflow/Workflow';

const store = useCollectionStore();
const { notify } = useNotifier();
const services = inject(ServicesKey);

const activeCollection = computed(() => store.activeCollection);
const activeRequest = computed(() => store.activeRequest);

const importDialog = ref(false);
const importText = ref('');
const importError = ref<string | null>(null);

const openApiUrl = ref('');
const openApiInput = ref<HTMLInputElement | null>(null);

const workflowRequestIds = ref<string[]>([]);
const workflowConditionType = ref<'always' | 'statusEquals' | 'variableEquals'>('always');
const workflowConditionValue = ref('200');
const lastWorkflow = ref<WorkflowExecutionResult | null>(null);

const availableRequests = computed<RequestDefinition[]>(() => {
  const list = activeCollection.value?.requests ?? [];
  return list.slice();
});

onMounted(async () => {
  await store.refresh();
  if (!store.activeCollectionId && store.collections[0]) {
    store.selectCollection(store.collections[0].id);
  }
});

async function onCreate(name: string) {
  await store.createCollection(name);
  notify('Collection created', 'success');
}

function onImport() {
  importText.value = '';
  importError.value = null;
  importDialog.value = true;
}

async function confirmImport() {
  try {
    const c = new CollectionImporter().import(importText.value);
    await collectionRepository().save(c);
    await store.refresh();
    store.selectCollection(c.id);
    importDialog.value = false;
    notify('Collection imported', 'success');
  } catch (e) {
    importError.value = (e as Error).message;
  }
}

async function onExport() {
  if (!activeCollection.value) return;
  const text = new CollectionExporter().export(activeCollection.value);
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${activeCollection.value.name}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function onUpdateRequest(r: RequestDefinition) {
  await store.updateRequest(r);
}

async function onVariablesChange(v: VariableEntry[]) {
  await store.setCollectionVariables(v);
}

function triggerOpenApiFile() {
  openApiInput.value?.click();
}

async function onOpenApiFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const text = await file.text();
  const generator = services?.openApiService.importFromText(text);
  if (!generator) return;
  const coll = generator.toCollection(file.name.replace(/\.[^.]+$/, ''));
  await collectionRepository().save(coll);
  await store.refresh();
  store.selectCollection(coll.id);
  notify(`Imported ${coll.requests.length} requests from OpenAPI`, 'success');
}

async function importOpenApi() {
  if (!openApiUrl.value) return;
  try {
    const res = await fetch(openApiUrl.value);
    const text = await res.text();
    const generator = services?.openApiService.importFromText(text);
    if (!generator) return;
    const coll = generator.toCollection('Imported');
    await collectionRepository().save(coll);
    await store.refresh();
    store.selectCollection(coll.id);
    notify(`Imported ${coll.requests.length} requests`, 'success');
  } catch (e) {
    notify(`OpenAPI import failed: ${(e as Error).message}`, 'error');
  }
}

async function runWorkflow() {
  if (!activeCollection.value || workflowRequestIds.value.length < 2) return;
  const requests = workflowRequestIds.value
    .map((id) => activeCollection.value!.requests.find((r) => r.id === id))
    .filter((r): r is RequestDefinition => Boolean(r));
  let condition;
  if (workflowConditionType.value === 'statusEquals') {
    condition = { type: 'statusEquals' as const, value: Number(workflowConditionValue.value) || 200 };
  } else if (workflowConditionType.value === 'variableEquals') {
    const [name, ...rest] = workflowConditionValue.value.split('=');
    condition = { type: 'variableEquals' as const, name: name?.trim() ?? '', value: rest.join('=').trim() };
  } else {
    condition = { type: 'always' as const };
  }
  const baseSteps = buildLinearWorkflowFromRequests(requests);
  const steps = baseSteps.map((s, idx) =>
    idx === 0
      ? { ...s, condition }
      : { ...s, condition: { type: 'always' as const } },
  );
  const wf = { id: 'wf', name: 'Run', steps };
  const engine = new WorkflowEngine(new RequestExecutionService(httpClient()));
  lastWorkflow.value = await engine.run({
    workflow: wf,
    requests,
    initialBundle: { collection: activeCollection.value.variables, request: [], runtime: [] },
  });
  notify(lastWorkflow.value.ok ? 'Workflow passed' : 'Workflow failed', lastWorkflow.value.ok ? 'success' : 'error');
}
</script>