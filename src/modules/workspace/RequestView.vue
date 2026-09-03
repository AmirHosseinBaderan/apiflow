<template>
  <div>
    <v-row v-if="!activeRequest && !requestLoading">
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
    <v-row v-else-if="requestLoading">
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
            v-if="activeRequest"
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
import type { RequestDefinition } from '@domain/request/RequestDefinition';
import type { VariableEntry } from '@domain/variable/VariableScope';

const store = useCollectionStore();
const route = useRoute();

const activeRequest = computed(() => store.activeRequest);
const activeCollection = computed(() => store.activeCollection);
const isUnsorted = computed(() => {
  if (!store.activeRequestId) return false;
  return store.isRequestUnsorted(store.activeRequestId);
});
const requestLoading = computed(() => store.requestLoading);

const collectionId = computed(() => route.params.collectionId as string | undefined);

watch(
  () => store.activeRequestId,
  async (requestId) => {
    if (!requestId || !collectionId.value) return;
    const cached = store.requestCache.get(requestId);
    if (!cached && store.activeCollection) {
      await store.loadRequest(store.activeCollection.id, requestId);
    }
  },
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
    title: 'Save request',
    props: {
      requestId,
      onSave: async (cid: string, folderId: string | null) => {
        await store.saveUnsortedRequestToCollection(requestId, cid, folderId);
      },
    },
  });
}
</script>
