<template>
  <div>
    <v-text-field
      v-model="name"
      :label="t('newFolderName')"
      autofocus
      hide-details
      @keyup.enter="save"
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
        @click="save"
      >
        {{ t('save') }}
      </v-btn>
    </v-card-actions>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useDialogStore } from '@stores/useDialogStore';
import { useNotifier } from '@composables/useNotifier';
import { useLocaleStore } from '@i18n/store';

const props = defineProps<{ collectionId: string; folderId: string; currentName: string }>();
const store = useCollectionStore();
const dialog = useDialogStore();
const notifier = useNotifier();
const locale = useLocaleStore();
const t = (key: string) => locale.t(key);

const name = ref(props.currentName);

watch(
  () => props.currentName,
  (v) => (name.value = v),
);

function close() {
  dialog.closeDialog();
}

async function save() {
  const n = name.value.trim();
  if (!n) return;
  await store.renameFolder(props.collectionId, props.folderId, n);
  notifier.notify('Folder renamed', 'success');
  close();
}
</script>
