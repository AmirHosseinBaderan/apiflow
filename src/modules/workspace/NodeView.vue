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
          <v-card-title class="text-h6">Workflows</v-card-title>
          <v-card-text class="pa-0">
            <v-list density="compact">
              <v-list-item
                v-for="wf in savedWorkflows"
                :key="wf.id"
                :title="wf.name"
                :subtitle="wf.description ?? `${wf.steps.length} steps`"
                @click="gotoWorkflow(wf)"
              >
                <template v-slot:prepend>
                  <v-icon icon="mdi-play-box-outline" size="small" />
                </template>
                <template v-slot:append>
                  <v-chip size="small" variant="text">{{ wf.steps.length }} steps</v-chip>
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    color="error"
                    @click.stop="deleteWorkflow(wf)"
                  />
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="primary" prepend-icon="mdi-plus" @click="addDialog = true">
              Add workflow
            </v-btn>
          </v-card-actions>
        </v-card>

        <v-dialog v-model="addDialog" width="480">
          <v-card>
            <v-card-title>Add workflow</v-card-title>
            <v-card-text>
              <v-text-field v-model="newWorkflowName" label="Name" density="compact" class="mt-2" />
              <v-text-field
                v-model="newWorkflowDescription"
                label="Description"
                density="compact"
                class="mt-1"
              />
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn text @click="addDialog = false">Cancel</v-btn>
              <v-btn color="primary" @click="createWorkflow">Add</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-alert
          v-if="!savedWorkflows.length"
          class="mt-3"
          type="info"
          variant="tonal"
          density="compact"
        >
          No workflows yet. Add one and open it to design its steps.
        </v-alert>
      </v-col>
    </template>
  </v-row>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useNotifier } from '@composables/useNotifier';
import type { Workflow } from '@domain/workflow/Workflow';
import type { CollectionTreeNode } from '@stores/useCollectionStore';
import { createId } from '@shared/id';

const store = useCollectionStore();
const router = useRouter();
const route = useRoute();
const { notify } = useNotifier();

const activeCollection = computed(() => store.activeCollection);
const folderId = computed(() => route.params.folderId as string | undefined);
const node = computed(() => store.activeTreeNode(folderId.value ?? null));
const savedWorkflows = computed(() => activeCollection.value?.workflows ?? []);

const addDialog = ref(false);
const newWorkflowName = ref('');
const newWorkflowDescription = ref('');

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

function gotoWorkflow(wf: Workflow) {
  const cid = activeCollection.value?.id;
  if (cid) router.push({ name: 'workflow', params: { collectionId: cid, workflowId: wf.id } });
}

async function createWorkflow() {
  if (!newWorkflowName.value) {
    notify('Give the workflow a name', 'warning');
    return;
  }
  const cid = activeCollection.value?.id;
  if (!cid) return;
  const wf: Workflow = {
    id: createId('wf'),
    name: newWorkflowName.value,
    description: newWorkflowDescription.value || undefined,
    steps: [],
  };
  await store.saveWorkflows([...savedWorkflows.value, wf]);
  addDialog.value = false;
  newWorkflowName.value = '';
  newWorkflowDescription.value = '';
  router.push({ name: 'workflow', params: { collectionId: cid, workflowId: wf.id } });
}

async function deleteWorkflow(wf: Workflow) {
  const cid = activeCollection.value?.id;
  if (!cid) return;
  if (!confirm(`Delete workflow "${wf.name}"?`)) return;
  await store.saveWorkflows(savedWorkflows.value.filter((w) => w.id !== wf.id));
}
</script>
