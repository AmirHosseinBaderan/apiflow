<template>
  <div>
    <v-text-field
      v-model="name"
      :label="t('folderName')"
      autofocus
      hide-details
      @keyup.enter="create"
    />
    <v-card-actions class="pa-0 mt-2">
      <v-spacer />
      <v-btn
        rounded="lg"
        @click="close"
      >
        {{ t('cancel') }}
      </v-btn>
      <v-btn
        rounded="lg"
        color="primary"
        :disabled="!name.trim()"
        @click="create"
      >
        {{ t('add') }}
      </v-btn>
    </v-card-actions>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useDialogStore } from '@stores/useDialogStore';
import { useNotifier } from '@composables/useNotifier';
import { useLocaleStore } from '@i18n/store';

const router = useRouter();
const store = useCollectionStore();
const dialog = useDialogStore();
const { notify } = useNotifier();
const locale = useLocaleStore();
const t = (key: string) => locale.t(key);

const name = ref('');

function close() {
  dialog.closeDialog();
}

async function create() {
  const n = name.value.trim();
  if (!n) return;
  await store.createFolder(n);
  notify(t('folderCreated'), 'success');
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
