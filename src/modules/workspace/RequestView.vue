<template>
  <div>
    <v-row v-if="!activeRequestId">
      <v-col cols="12">
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
        >
          No request selected. Pick a request from the sidebar to edit it.
        </v-alert>
      </v-col>
    </v-row>
    <v-row v-else-if="requestLoading || !activeRequest">
      <v-col cols="12">
        <v-progress-circular
          indeterminate
          color="primary"
        />
      </v-col>
    </v-row>
    <template v-else>
      <v-row>
        <v-col cols="12">
          <RequestEditor
            :request="activeRequest"
            :variables="activeCollection?.variables ?? []"
            :is-unsorted="isUnsorted"
            @update:request="onUpdateRequest"
            @update:variables="onVariablesChange"
            @save-request="onSaveRequest"
          />
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import RequestEditor from './RequestEditor.vue';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useDialogStore } from '@stores/useDialogStore';
import { useLocaleStore } from '@i18n/store';
import type { RequestDefinition } from '@domain/request/RequestDefinition';
import type { VariableEntry } from '@domain/variable/VariableScope';

const store = useCollectionStore();
const route = useRoute();
const locale = useLocaleStore();
const t = (key: string) => locale.t(key);

const activeRequest = computed(() => store.activeRequest);
const activeCollection = computed(() => store.activeCollection);
const activeRequestId = computed(() => store.activeRequestId);
const isUnsorted = computed(() => {
  if (!store.activeRequestId) return false;
  return store.isRequestUnsorted(store.activeRequestId);
});
const requestLoading = computed(() => store.requestLoading);

const collectionId = computed(() => route.params.collectionId as string | undefined);

watch(
  [() => store.activeRequestId, () => store.activeCollectionId],
  async ([requestId, _collectionId]) => {
    if (!requestId) return;
    if (store.isRequestUnsorted(requestId)) return;
    const cid = collectionId.value || store.ownerCollectionId(requestId);
    if (!cid) return;
    const cached = store.requestCache[requestId];
    if (!cached) {
      try {
        await store.loadRequest(cid, requestId);
      } catch (e) {
        console.error('Failed to load request:', e);
      }
    }
  },
  { immediate: true },
);

function onUpdateRequest(r: RequestDefinition) {
  store.updateRequest(r);
}

function onVariablesChange(v: VariableEntry[]) {
  store.setCollectionVariables(v);
}

async function onSaveRequest() {
  if (!isUnsorted.value) return;
  const requestId = store.activeRequestId;
  if (!requestId) return;
  
  const dialog = useDialogStore();
  dialog.openDialog({
    component: () => import('./dialogs/SaveRequestDialog.vue'),
    title: t('saveToCollection'),
    props: {
      requestId,
      onSave: async (cid: string, folderId: string | null) => {
        await store.saveUnsortedRequestToCollection(requestId, cid, folderId);
      },
    },
  });
}
</script>
