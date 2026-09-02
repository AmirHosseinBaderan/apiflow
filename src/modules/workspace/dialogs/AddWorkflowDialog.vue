<template>
  <v-card>
    <v-card-title>Add workflow</v-card-title>
    <v-card-text>
      <v-text-field v-model="name" label="Name" density="compact" hide-details autofocus />
      <v-text-field v-model="description" label="Description" density="compact" hide-details class="mt-1" />
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn text @click="close">Cancel</v-btn>
      <v-btn color="primary" :disabled="!name.trim()" @click="create">Add</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useDialogStore } from '@stores/useDialogStore';
import { createId } from '@shared/id';

const router = useRouter();
const store = useCollectionStore();
const dialog = useDialogStore();

const name = ref('');
const description = ref('');

function close() {
  dialog.closeDialog();
}

async function create() {
  const n = name.value.trim();
  if (!n) return;
  const cid = store.activeCollectionId;
  if (!cid) return close();
  const wf = {
    id: createId('wf'),
    name: n,
    description: description.value.trim() || undefined,
    steps: [],
  };
  await store.saveWorkflows([...(store.activeCollection?.workflows ?? []), wf]);
  close();
  router.push({ name: 'workflow', params: { collectionId: cid, workflowId: wf.id } });
}
</script>
