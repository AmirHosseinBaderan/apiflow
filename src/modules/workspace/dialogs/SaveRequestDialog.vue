<template>
  <v-dialog
    :model-value="dialog.open"
    max-width="480"
    @update:model-value="onClose"
  >
    <v-card>
      <v-card-title class="text-h6">
        Save request to collection
      </v-card-title>
      <v-card-text>
        <v-select
          v-model="selectedCollectionId"
          :items="collectionItems"
          label="Collection"
          item-title="name"
          item-value="id"
          hide-details
          class="mb-3"
        />
        <v-select
          v-model="selectedFolderId"
          :items="folderItems"
          label="Folder"
          item-title="name"
          item-value="id"
          hide-details
        >
          <template #prepend-item>
            <v-list-item
              value=""
              title="Root (no folder)"
              @click="selectedFolderId = ''"
            />
          </template>
        </v-select>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="onClose"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          :disabled="!selectedCollectionId"
          @click="onSave"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useDialogStore } from '@stores/useDialogStore';

const store = useCollectionStore();
const dialog = useDialogStore();

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
