<template>
  <div>
    <v-row v-if="!activeRequest">
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
    <template v-else>
      <v-row>
        <v-col cols="12">
          <RequestEditor
            :request="activeRequest"
            :variables="activeCollection?.variables ?? []"
            @update:request="onUpdateRequest"
            @update:variables="onVariablesChange"
          />
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import RequestEditor from './RequestEditor.vue';
import { useCollectionStore } from '@stores/useCollectionStore';
import type { RequestDefinition } from '@domain/request/RequestDefinition';
import type { VariableEntry } from '@domain/variable/VariableScope';

const store = useCollectionStore();

const activeRequest = computed(() => store.activeRequest);
const activeCollection = computed(() => store.activeCollection);

function onUpdateRequest(r: RequestDefinition) {
  store.updateRequest(r);
}

function onVariablesChange(v: VariableEntry[]) {
  store.setCollectionVariables(v);
}
</script>
