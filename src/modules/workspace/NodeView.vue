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
        {{ t('selectCollection') }}
      </v-alert>
    </v-col>

    <template v-else>
      <v-col cols="12">
        <div class="d-flex align-center mb-4 flex-wrap gap-2">
          <div>
            <span class="text-h6">{{ node?.name ?? activeCollection.name }}</span>
            <v-chip
              v-if="node?.kind === 'folder'"
              size="small"
              class="ml-2"
            >
              {{ t('folder') }}
            </v-chip>
            <v-chip
              v-else
              size="small"
              class="ml-2"
            >
              {{ t('collection') }}
            </v-chip>
          </div>
          <v-spacer />
          <v-btn
            v-if="node?.kind === 'folder'"
            rounded="lg"
            color="primary"
            :text="t('backToCollection')"
            @click="gotoCollection"
          />
          <v-btn
            rounded="lg"
            prepend-icon="mdi-export"
            variant="outlined"
            @click="onExport"
          >
            {{ t('export') }}
          </v-btn>
          <v-btn
            rounded="lg"
            prepend-icon="mdi-pencil"
            variant="outlined"
            @click="renameCollection"
          >
            {{ t('rename') }}
          </v-btn>
          <v-btn
            rounded="lg"
            prepend-icon="mdi-plus"
            color="primary"
            @click="addNewRequest"
          >
            {{ t('request') }}
          </v-btn>
          <v-btn
            rounded="lg"
            prepend-icon="mdi-folder-plus"
            variant="outlined"
            @click="addNewFolder"
          >
            {{ t('folder') }}
          </v-btn>
        </div>
      </v-col>

      <v-col
        v-if="node?.kind === 'collection'"
        cols="12"
        md="4"
      >
        <v-card>
          <v-card-title class="text-h6">
            {{ t('collectionDetails') }}
          </v-card-title>
          <v-card-text>
            <div class="text-subtitle-1 font-weight-medium">
              {{ activeCollection.name }}
            </div>
            <div
              v-if="activeCollection?.description"
              class="text-body-2 text-medium-emphasis mt-1"
            >
              {{ activeCollection.description }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ t('updated') }} {{ formatDateValue(activeCollection?.updatedAt) }}
            </div>
            <div class="d-flex gap-3 mt-3">
              <div
                class="text-center pa-2 rounded bg-grey-lighten-4"
                style="min-width: 64px;"
              >
                <div class="text-h6">
                  {{ activeCollection.requests.length }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ t('items') }}
                </div>
              </div>
              <div
                class="text-center pa-2 rounded bg-grey-lighten-4"
                style="min-width: 64px;"
              >
                <div class="text-h6">
                  {{ activeCollection.folders.length }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ t('folder') }}
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <v-card class="mt-4">
          <v-card-title class="text-h6">
            {{ t('variables') }}
          </v-card-title>
          <v-card-text class="pa-0">
            <v-list density="compact">
              <v-list-item
                v-for="(v, i) in mutableVariables"
                :key="v.key || i"
                class="align-top"
              >
                <v-row
                  dense
                  align="center"
                >
                  <v-col cols="4">
                    <v-text-field
                      v-model="mutableVariables[i].key"
                      :label="t('name')"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      v-model="mutableVariables[i].value"
                      :type="v.secret ? 'password' : 'text'"
                      :label="t('value')"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="auto">
                    <v-checkbox-btn
                      v-model="mutableVariables[i].enabled"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="auto">
                    <v-switch
                      v-model="mutableVariables[i].secret"
                      inset
                      hide-details
                      class="mt-1"
                    />
                  </v-col>
                  <v-col cols="auto">
                    <v-btn
                      rounded="lg"
                      icon="mdi-delete"
                      size="small"
                      color="error"
                      @click="removeCollectionVar(i)"
                    />
                  </v-col>
                </v-row>
              </v-list-item>
            </v-list>
            <v-btn
              rounded="lg"
              prepend-icon="mdi-plus"
              variant="text"
              class="ml-2"
              @click="addCollectionVar"
            >
              {{ t('addVariable') }}
            </v-btn>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              rounded="lg"
              color="primary"
              @click="saveCollectionVariables"
            >
              {{ t('save') }}
            </v-btn>
          </v-card-actions>
        </v-card>

        <v-card class="mt-4">
          <v-card-title class="text-h6">
            {{ t('workflows') }}
          </v-card-title>
          <v-card-text class="pa-0">
            <v-list density="compact">
              <v-list-item
                v-for="wf in savedWorkflows"
                :key="wf.id"
                :title="wf.name"
                :subtitle="wf.description ?? `${wf.steps.length} ${t('steps')}`"
                @click="gotoWorkflow(wf)"
              >
                <template #prepend>
                  <v-icon
                    icon="mdi-play-box-outline"
                    size="small"
                  />
                </template>
                <template #append>
                  <v-chip
                    size="small"
                    variant="text"
                  >
                    {{ wf.steps.length }} {{ t('steps') }}
                  </v-chip>
                  <v-btn
                    rounded="lg"
                    icon="mdi-delete"
                    size="small"
                    color="error"
                    @click.stop="deleteWorkflow(wf)"
                  />
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              rounded="lg"
              color="primary"
              prepend-icon="mdi-plus"
              @click="addWorkflow"
            >
              {{ t('addWorkflow') }}
            </v-btn>
          </v-card-actions>
        </v-card>

        <v-alert
          v-if="!savedWorkflows.length"
          class="mt-3"
          type="info"
          variant="tonal"
          density="compact"
        >
          {{ t('noWorkflows') }}
        </v-alert>
      </v-col>

      <v-col
        cols="12"
        :md="node?.kind === 'collection' ? '8' : '12'"
      >
        <v-card>
          <v-card-title class="text-h6">
            {{ node?.kind === 'folder' ? t('folder') : t('collection') }} {{ t('items') }}
          </v-card-title>
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
                  <v-icon
                    :icon="iconFor(sub.kind)"
                    size="small"
                  />
                </template>
                <template
                  v-if="sub.kind === 'folder'"
                  #append
                >
                  <v-icon
                    icon="mdi-chevron-right"
                    size="small"
                  />
                </template>
              </v-list-item>
              <v-list-item
                v-if="(node?.children ?? []).length === 0"
                :title="t('empty')"
                value=""
              />
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col
        v-if="runtimeVariables.length"
        cols="12"
      >
        <v-card>
          <v-card-title class="text-h6">
            {{ t('runtimeVariables') }}
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item
                v-for="rv in runtimeVariables"
                :key="rv.key"
                :title="rv.key"
                :subtitle="rv.value"
                density="compact"
              />
            </v-list>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              rounded="lg"
              color="primary"
              @click="clearRuntime"
            >
              {{ t('clearRuntime') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </template>
  </v-row>
</template>

<script setup lang="ts">
import { computed, ref, watch, defineAsyncComponent } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useDialogStore } from '@stores/useDialogStore';
import { useExecutionStore } from '@stores/useExecutionStore';
import { useTabStore } from '@stores/useTabStore';
import { useNotifier } from '@composables/useNotifier';
import type { CollectionTreeNode } from '@stores/useCollectionStore';
import type { VariableEntry } from '@domain/variable/VariableScope';
import type { Workflow } from '@domain/workflow/Workflow';
import { formatDate } from '../../i18n/date';
import { useLocaleStore } from '../../i18n/store';
import { CollectionExporter } from '@application/imports/CollectionExchange';

interface EditableVar {
  key: string;
  value: string;
  enabled: boolean;
  secret: boolean;
}

const store = useCollectionStore();
const router = useRouter();
const route = useRoute();
const dialog = useDialogStore();
const execution = useExecutionStore();
const tabs = useTabStore();
const locale = useLocaleStore();
const { notify } = useNotifier();
const t = (key: string) => locale.t(key);

const activeCollection = computed(() => store.activeCollection);
const folderId = computed(() => route.params.folderId as string | undefined);
const node = computed(() => store.activeTreeNode(folderId.value ?? null));
const savedWorkflows = computed(() => activeCollection.value?.workflows ?? []);

const mutableVariables = ref<EditableVar[]>([]);

watch(
  () => activeCollection.value?.variables,
  (vars) => {
    mutableVariables.value = (vars ?? []).map((v: VariableEntry): EditableVar => ({
      key: v.key,
      value: v.value,
      enabled: v.enabled,
      secret: v.secret,
    }));
  },
  { immediate: true },
);

const runtimeVariables = computed(() => execution.runtimeVariables);

function iconFor(kind: CollectionTreeNode['kind']) {
  if (kind === 'request') return 'mdi-file-document-outline';
  return 'mdi-folder-outline';
}

function openNode(item: CollectionTreeNode) {
  const cid = activeCollection.value?.id;
  if (!cid) return;
  if (item.kind === 'folder') {
    tabs.openRoute('node', { collectionId: cid, folderId: item.id }, item.name);
    router.push({ name: 'node', params: { collectionId: cid, folderId: item.id } });
  } else if (item.kind === 'request') {
    tabs.openRoute('request', { collectionId: cid, requestId: item.id }, item.name);
    router.push({ name: 'request', params: { collectionId: cid, requestId: item.id } });
  }
}

function gotoCollection() {
  const cid = activeCollection.value?.id;
  if (cid) {
    tabs.openRoute('collection', { collectionId: cid }, activeCollection.value?.name ?? '');
    router.push({ name: 'collection', params: { collectionId: cid } });
  }
}

function gotoWorkflow(wf: Workflow) {
  const cid = activeCollection.value?.id;
  if (cid) {
    tabs.openRoute('workflow', { collectionId: cid, workflowId: wf.id }, wf.name);
    router.push({ name: 'workflow', params: { collectionId: cid, workflowId: wf.id } });
  }
}

function addWorkflow() {
  dialog.openDialog({
    component: defineAsyncComponent(() => import('./dialogs/AddWorkflowDialog.vue')),
    title: t('addWorkflow'),
  });
}

async function deleteWorkflow(wf: Workflow) {
  if (!confirm(`Delete workflow "${wf.name}"?`)) return;
  await store.saveWorkflows(savedWorkflows.value.filter((w) => w.id !== wf.id));
}

function renameCollection() {
  const cid = activeCollection.value?.id;
  if (!cid) return;
  dialog.openDialog({
    component: defineAsyncComponent(() => import('./dialogs/RenameCollectionDialog.vue')),
    title: t('renameCollection'),
    props: { id: cid, currentName: activeCollection.value?.name },
  });
}

function addCollectionVar() {
  mutableVariables.value = [
    ...mutableVariables.value,
    { key: '', value: '', enabled: true, secret: false },
  ];
}

function removeCollectionVar(i: number) {
  mutableVariables.value = mutableVariables.value.filter((_, idx) => idx !== i);
}

async function saveCollectionVariables() {
  if (!activeCollection.value) return;
  const cleaned = mutableVariables.value
    .filter((v) => v.key.trim())
    .map((v) => ({
      key: v.key,
      value: v.value,
      enabled: v.enabled,
      secret: v.secret,
    }));
  await store.setCollectionVariables(cleaned);
}

function clearRuntime() {
  execution.clearRuntime();
}

function formatDateValue(value: string | undefined): string {
  return value ? formatDate(value, locale.locale) : '';
}

function onExport() {
  const c = activeCollection.value;
  if (!c) return;
  const text = new CollectionExporter().export(c);
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${c.name}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function addNewRequest() {
  const cid = activeCollection.value?.id;
  if (!cid) return;
  const name = 'New Request';
  const req = await store.createRequest(name);
  notify('Request created', 'success');
  if (req) {
    tabs.openRoute('request', { collectionId: cid, requestId: req.id }, name);
    router.push({ name: 'request', params: { collectionId: cid, requestId: req.id } });
  }
}

async function addNewFolder() {
  const cid = activeCollection.value?.id;
  if (!cid) return;
  const name = 'New Folder';
  await store.createFolder(name);
  const folderId = store.activeCollection?.folders.find((f) => f.name === name)?.id ?? null;
  notify('Folder created', 'success');
  if (folderId) {
    tabs.openRoute('node', { collectionId: cid, folderId: folderId }, name);
    router.push({ name: 'node', params: { collectionId: cid, folderId: folderId } });
  } else {
    tabs.openRoute('collection', { collectionId: cid }, store.activeCollection?.name ?? name);
    router.push({ name: 'collection', params: { collectionId: cid } });
  }
}
</script>