<template>
  <div>
    <v-select
      v-model="selectedCollectionId"
      :items="collectionItems"
      :label="t('collection')"
      item-title="name"
      item-value="id"
      hide-details
      class="mb-3"
    />
    <v-select
      v-model="selectedFolderId"
      :items="folderItems"
      :label="t('saveToFolder')"
      item-title="name"
      item-value="id"
      hide-details
    >
      <template #prepend-item>
        <v-list-item
          value=""
          :title="t('rootFolder')"
          @click="selectedFolderId = ''"
        />
      </template>
    </v-select>
    <v-card-actions class="pa-0 mt-4">
      <v-spacer />
      <v-btn
        rounded="lg"
        variant="text"
        @click="onClose"
      >
        {{ t('cancel') }}
      </v-btn>
      <v-btn
        rounded="lg"
        color="primary"
        :disabled="!selectedCollectionId"
        @click="onSave"
      >
        {{ t('save') }}
      </v-btn>
    </v-card-actions>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useDialogStore } from '@stores/useDialogStore';
import { useLocaleStore } from '@i18n/store';

const store = useCollectionStore();
const dialog = useDialogStore();
const locale = useLocaleStore();
const t = (key: string) => locale.t(key);

const selectedCollectionId = ref('');
const selectedFolderId = ref('');

const collectionItems = computed(() =>
  store.collections.map((c) => ({ id: c.id, name: c.name })),
);

const folderItems = computed(() => {
  const c = store.collections.find((c) => c.id === selectedCollectionId.value);
  if (!c) return [];
  return c.folders.map((f) => ({ id: f.id, name: f.name }));
});

watch(
  () => selectedCollectionId.value,
  () => {
    selectedFolderId.value = '';
  },
);

function onClose() {
  dialog.closeDialog();
}

function onSave() {
  if (!selectedCollectionId.value) return;
  const props = dialog.current?.props as { requestId?: string; onSave?: (collectionId: string, folderId: string) => void } | undefined;
  if (props?.onSave) {
    props.onSave(selectedCollectionId.value, selectedFolderId.value || '');
  }
  dialog.closeDialog();
}
</script>
