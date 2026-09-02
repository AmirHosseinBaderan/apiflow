<template>
  <div>
    <v-text-field
      v-model="name"
      label="Folder name"
      autofocus
      density="compact"
      hide-details
      @keyup.enter="create"
    />
    <v-card-actions class="pa-0 mt-2">
      <v-spacer />
      <v-btn text @click="close">Cancel</v-btn>
      <v-btn color="primary" :disabled="!name.trim()" @click="create">Create</v-btn>
    </v-card-actions>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useDialogStore } from '@stores/useDialogStore';
import { useNotifier } from '@composables/useNotifier';

const router = useRouter();
const store = useCollectionStore();
const dialog = useDialogStore();
const { notify } = useNotifier();

const name = ref('');

function close() {
  dialog.closeDialog();
}

async function create() {
  const n = name.value.trim();
  if (!n) return;
  await store.createFolder(n);
  notify('Folder created', 'success');
  if (store.activeCollectionId) {
    const coll = store.activeCollection;
    const folderId = coll?.folders.find((f) => f.name === n)?.id ?? null;
    if (folderId) {
      router.replace({ name: 'node', params: { collectionId: store.activeCollectionId, folderId } });
    } else {
      router.replace({ name: 'collection', params: { collectionId: store.activeCollectionId } });
    }
  }
  close();
}
</script>
