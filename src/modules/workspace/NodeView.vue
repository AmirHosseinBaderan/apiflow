<template>
  <v-row>
    <v-col cols="12" v-if="!activeCollection">
      <v-alert type="info" variant="tonal" density="compact">
        {{ t('selectCollection') }}
      </v-alert>
    </v-col>

    <template v-else>
      <v-col cols="12">
        <div class="d-flex align-center mb-2">
          <span class="text-h6">{{ node?.name ?? activeCollection.name }}</span>
          <v-chip v-if="node?.kind === 'folder'" size="small" class="ml-2">{{ t('folder') }}</v-chip>
          <v-chip v-else size="small" class="ml-2">{{ t('collection') }}</v-chip>
          <v-spacer />
          <v-btn
            v-if="node?.kind === 'folder'"
            color="primary"
            size="small"
            :text="t('backToCollection')"
            @click="gotoCollection"
          />
        </div>
      </v-col>

      <v-col cols="12">
        <v-card>
          <v-card-title>{{ t('items') }}</v-card-title>
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
              <v-list-item v-if="(node?.children ?? []).length === 0" :title="t('empty')" value="" />
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" v-if="node?.kind === 'collection'">
        <v-card>
          <v-card-title>{{ t('collectionDetails') }}</v-card-title>
          <v-card-text>
            <div class="text-h6">{{ node?.name }}</div>
            <div
              v-if="activeCollection?.description"
              class="text-body-2 text-medium-emphasis mt-1"
            >{{ activeCollection?.description }}</div>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ t('updated') }} {{ formatDateValue(activeCollection?.updatedAt) }}
            </div>
            <div v-if="activeCollection?.variables.length" class="mt-2">
              <div class="text-caption text-medium-emphasis">{{ t('variables') }}</div>
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
          <v-card-title class="text-h6">{{ t('workflows') }}</v-card-title>
          <v-card-text class="pa-0">
            <v-list density="compact">
              <v-list-item
                v-for="wf in savedWorkflows"
                :key="wf.id"
                :title="wf.name"
                :subtitle="wf.description ?? `${wf.steps.length} ${t('steps')}`"
                @click="gotoWorkflow(wf)"
              >
                <template v-slot:prepend>
                  <v-icon icon="mdi-play-box-outline" size="small" />
                </template>
                <template v-slot:append>
                  <v-chip size="small" variant="text">{{ wf.steps.length }} {{ t('steps') }}</v-chip>
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
            <v-btn color="primary" prepend-icon="mdi-plus" @click="addWorkflow">{{ t('addWorkflow') }}</v-btn>
          </v-card-actions>
        </v-card>

        <v-alert v-if="!savedWorkflows.length" class="mt-3" type="info" variant="tonal" density="compact">
          {{ t('noWorkflows') }}
        </v-alert>
      </v-col>
    </template>
  </v-row>
</template>

<script setup lang="ts">
import { computed, ref, defineAsyncComponent } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useDialogStore } from '@stores/useDialogStore';
import type { CollectionTreeNode } from '@stores/useCollectionStore';
import type { Workflow } from '@domain/workflow/Workflow';
import {formatDate} from "../../i18n/date";
import {useLocaleStore} from "../../i18n/store";

const store = useCollectionStore();
const router = useRouter();
const route = useRoute();
const dialog = useDialogStore();
const locale = useLocaleStore();
const t = (key: string) => locale.t(key);

const activeCollection = computed(() => store.activeCollection);
const folderId = computed(() => route.params.folderId as string | undefined);
const node = computed(() => store.activeTreeNode(folderId.value ?? null));
const savedWorkflows = computed(() => activeCollection.value?.workflows ?? []);

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

function formatDateValue(value: string | undefined): string {
  return value ? formatDate(value, locale.locale) : '';
}
</script>
