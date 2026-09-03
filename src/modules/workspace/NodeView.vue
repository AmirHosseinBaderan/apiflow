<template>
  <v-container
    fluid
    class="node-view"
  >
    <v-row v-if="!activeCollection">
      <v-col cols="12">
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
        >
          {{ t('selectCollection') }}
        </v-alert>
      </v-col>
    </v-row>

    <template v-else>
      <v-row>
        <v-col cols="12">
          <div class="page-header">
            <div class="page-title">
              <span class="text-h5 font-weight-regular">{{ node?.name ?? activeCollection.name }}</span>
              <v-chip
                v-if="node?.kind === 'folder'"
                size="small"
                variant="tonal"
                class="ml-2"
              >
                {{ t('folder') }}
              </v-chip>
              <v-chip
                v-else
                size="small"
                variant="tonal"
                color="primary"
                class="ml-2"
              >
                {{ t('collection') }}
              </v-chip>
            </div>
            <div class="page-actions">
              <template v-if="node?.kind === 'folder'">
                <v-btn
                  rounded="lg"
                  color="primary"
                  :text="t('backToCollection')"
                  @click="gotoCollection"
                />
                <v-btn
                  rounded="lg"
                  prepend-icon="mdi-pencil"
                  variant="outlined"
                  @click="renameFolder"
                >
                  {{ t('renameFolder') }}
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
                  @click="addSubfolder"
                >
                  {{ t('addSubfolder') }}
                </v-btn>
              </template>
              <template v-else>
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
              </template>
            </div>
          </div>
        </v-col>

        <v-col
          v-if="node?.kind === 'collection'"
          cols="12"
          md="4"
          lg="3"
        >
          <v-card
            variant="flat"
            class="info-card"
          >
            <v-card-text>
              <div class="text-caption text-medium-emphasis mb-1">
                {{ t('updated') }}
              </div>
              <div class="text-body-2 mb-3">
                {{ formatDateValue(activeCollection?.updatedAt) }}
              </div>
              <div class="d-flex gap-3">
                <div class="stat-chip">
                  <span class="text-h6">{{ activeCollection.requests.length }}</span>
                  <span class="text-caption text-medium-emphasis">{{ t('items') }}</span>
                </div>
                <div class="stat-chip">
                  <span class="text-h6">{{ activeCollection.folders.length }}</span>
                  <span class="text-caption text-medium-emphasis">{{ t('folder') }}</span>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col
          cols="12"
          :md="node?.kind === 'collection' ? '8' : '12'"
          :lg="node?.kind === 'collection' ? '9' : '12'"
        >
          <v-card
            variant="flat"
            class="items-card"
          >
            <v-card-text>
              <div class="d-flex align-center justify-space-between mb-3">
                <div class="text-subtitle-2 font-weight-medium">
                  {{ node?.kind === 'folder' ? t('folder') : t('collection') }} {{ t('items') }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ node?.children?.length ?? 0 }} {{ t('items') }}
                </div>
              </div>
              <v-list
                density="compact"
                class="bg-transparent pa-0"
              >
                <v-list-item
                  v-for="sub in node?.children ?? []"
                  :key="sub.id"
                  :title="sub.name"
                  :value="sub.id"
                  class="item-row"
                  @click="openNode(sub)"
                >
                  <template #prepend>
                    <v-icon
                      :icon="iconFor(sub.kind)"
                      size="small"
                      class="item-icon"
                    />
                  </template>
                  <template
                    v-if="sub.kind === 'folder'"
                    #append
                  >
                    <v-icon
                      icon="mdi-chevron-right"
                      size="small"
                      class="text-medium-emphasis"
                    />
                  </template>
                </v-list-item>
                <v-list-item
                  v-if="(node?.children ?? []).length === 0"
                  :title="t('empty')"
                  value=""
                  class="text-medium-emphasis"
                />
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col
          v-if="node?.kind === 'collection'"
          cols="12"
        >
          <v-card
            variant="flat"
            class="variables-card"
          >
            <v-card-text>
              <div class="d-flex align-center justify-space-between mb-3">
                <div class="text-subtitle-2 font-weight-medium">
                  {{ t('variables') }}
                </div>
                <v-btn
                  rounded="lg"
                  prepend-icon="mdi-plus"
                  variant="text"
                  size="small"
                  @click="addCollectionVar"
                >
                  {{ t('addVariable') }}
                </v-btn>
              </div>
              <v-table
                density="compact"
                class="variables-table bg-transparent"
              >
                <thead>
                  <tr>
                    <th class="text-left text-caption text-medium-emphasis font-weight-normal">
                      Enabled
                    </th>
                    <th class="text-left text-caption text-medium-emphasis font-weight-normal">
                      {{ t('name') }}
                    </th>
                    <th class="text-left text-caption text-medium-emphasis font-weight-normal">
                      {{ t('value') }}
                    </th>
                    <th class="text-left text-caption text-medium-emphasis font-weight-normal">
                      Secret
                    </th>
                    <th
                      class="text-right text-caption text-medium-emphasis font-weight-normal"
                      style="width: 48px;"
                    />
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(v, i) in mutableVariables"
                    :key="v.key || i"
                    class="var-row"
                  >
                    <td style="width: 80px;">
                      <v-checkbox-btn
                        v-model="mutableVariables[i].enabled"
                        hide-details
                        density="compact"
                      />
                    </td>
                    <td>
                      <v-text-field
                        v-model="mutableVariables[i].key"
                        :label="t('name')"
                        hide-details
                        density="compact"
                        variant="plain"
                        class="var-input"
                      />
                    </td>
                    <td>
                      <v-text-field
                        v-model="mutableVariables[i].value"
                        :type="v.secret ? 'password' : 'text'"
                        :label="t('value')"
                        hide-details
                        density="compact"
                        variant="plain"
                        class="var-input"
                      />
                    </td>
                    <td style="width: 80px;">
                      <v-switch
                        v-model="mutableVariables[i].secret"
                        inset
                        hide-details
                        density="compact"
                      />
                    </td>
                    <td
                      class="text-right"
                      style="width: 48px;"
                    >
                      <v-btn
                        rounded="lg"
                        icon="mdi-delete"
                        size="x-small"
                        variant="text"
                        color="error"
                        @click="removeCollectionVar(i)"
                      />
                    </td>
                  </tr>
                  <tr v-if="!mutableVariables.length">
                    <td
                      colspan="5"
                      class="text-medium-emphasis text-caption"
                    >
                      {{ t('noVariables') }}
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
            <v-card-actions class="pa-4 pt-0">
              <v-spacer />
              <v-btn
                rounded="lg"
                color="primary"
                size="small"
                @click="saveCollectionVariables"
              >
                {{ t('save') }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <v-col
          v-if="node?.kind === 'collection' && savedWorkflows.length"
          cols="12"
        >
          <v-card
            variant="flat"
            class="workflows-card"
          >
            <v-card-text>
              <div class="d-flex align-center justify-space-between mb-3">
                <div class="text-subtitle-2 font-weight-medium">
                  {{ t('workflows') }}
                </div>
                <v-btn
                  rounded="lg"
                  prepend-icon="mdi-plus"
                  variant="outlined"
                  size="small"
                  @click="addWorkflow"
                >
                  {{ t('addWorkflow') }}
                </v-btn>
              </div>
              <v-list
                density="compact"
                class="bg-transparent pa-0"
              >
                <v-list-item
                  v-for="wf in savedWorkflows"
                  :key="wf.id"
                  :title="wf.name"
                  :subtitle="wf.description ?? `${wf.steps.length} ${t('steps')}`"
                  class="workflow-row"
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
                      size="x-small"
                      variant="tonal"
                    >
                      {{ wf.steps.length }} {{ t('steps') }}
                    </v-chip>
                    <v-btn
                      rounded="lg"
                      icon="mdi-delete"
                      size="x-small"
                      variant="text"
                      color="error"
                      @click.stop="deleteWorkflow(wf)"
                    />
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col
          v-if="node?.kind === 'collection' && !savedWorkflows.length"
          cols="12"
        >
          <v-card
            variant="flat"
            class="workflows-card"
          >
            <v-card-text>
              <div class="d-flex align-center justify-space-between mb-3">
                <div class="text-subtitle-2 font-weight-medium">
                  {{ t('workflows') }}
                </div>
                <v-btn
                  rounded="lg"
                  prepend-icon="mdi-plus"
                  variant="outlined"
                  size="small"
                  @click="addWorkflow"
                >
                  {{ t('addWorkflow') }}
                </v-btn>
              </div>
              <v-alert
                type="info"
                variant="tonal"
                density="compact"
              >
                {{ t('noWorkflows') }}
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col
          v-if="runtimeVariables.length"
          cols="12"
        >
          <v-card
            variant="flat"
            class="runtime-card"
          >
            <v-card-text>
              <div class="d-flex align-center justify-space-between">
                <div class="text-subtitle-2 font-weight-medium">
                  {{ t('runtimeVariables') }}
                </div>
                <v-btn
                  rounded="lg"
                  color="primary"
                  variant="outlined"
                  size="small"
                  @click="clearRuntime"
                >
                  {{ t('clearRuntime') }}
                </v-btn>
              </div>
              <v-list
                density="compact"
                class="bg-transparent pa-0 mt-2"
              >
                <v-list-item
                  v-for="rv in runtimeVariables"
                  :key="rv.key"
                  :title="rv.key"
                  :subtitle="rv.value"
                  density="compact"
                />
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>
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

function renameFolder() {
  const cid = activeCollection.value?.id;
  const fid = folderId.value;
  if (!cid || !fid) return;
  const folder = node.value;
  if (folder?.kind !== 'folder') return;
  dialog.openDialog({
    component: defineAsyncComponent(() => import('./dialogs/RenameFolderDialog.vue')),
    title: t('renameFolder'),
    props: { collectionId: cid, folderId: fid, currentName: folder.name },
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

async function addSubfolder() {
  const cid = activeCollection.value?.id;
  const fid = folderId.value;
  if (!cid || !fid) return;
  const name = 'New Subfolder';
  await store.createFolder(name, fid);
  notify('Subfolder created', 'success');
  tabs.openRoute('node', { collectionId: cid, folderId: fid }, name);
  router.push({ name: 'node', params: { collectionId: cid, folderId: fid } });
}
</script>

<style scoped lang="scss">
.node-view {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(var(--v-divider-color), 0.6);
  margin-bottom: 24px;
}

.page-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.page-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.info-card {
  background: rgba(var(--v-theme-surface-variant), 0.04);
  border: 1px solid rgba(var(--v-border-color), 0.12);
}

.stat-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(var(--v-theme-surface-variant), 0.08);
  min-width: 64px;
}

.items-card {
  background: transparent;
}

.variables-card {
  background: transparent;
}

.variables-table :deep(.v-table) {
  background: transparent;
}

.variables-table :deep(.v-table__wrapper) {
  background: transparent;
}

.variables-table :deep(th) {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.2);
  padding: 8px 12px;
}

.variables-table :deep(td) {
  padding: 4px 12px;
  vertical-align: middle;
}

.var-row {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.08);
  transition: background-color 0.12s ease;

  &:hover {
    background-color: rgba(var(--v-theme-surface-variant), 0.04);
  }
}

.var-input :deep(.v-field) {
  box-shadow: none;
  background: transparent;
}

.workflows-card {
  background: transparent;
}

.workflow-row {
  border-radius: 8px;
  margin-bottom: 2px;
  transition: background-color 0.12s ease;

  &:hover {
    background-color: rgba(var(--v-theme-surface-variant), 0.04);
  }
}

.item-row {
  border-radius: 8px;
  margin-bottom: 2px;
  transition: background-color 0.12s ease;

  &:hover {
    background-color: rgba(var(--v-theme-surface-variant), 0.04);
  }
}

.item-icon {
  margin-right: 8px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.runtime-card {
  background: rgba(var(--v-theme-surface-variant), 0.04);
  border: 1px solid rgba(var(--v-border-color), 0.12);
}
</style>
