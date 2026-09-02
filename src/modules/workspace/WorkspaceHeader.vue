<template>
  <v-app-bar density="comfortable" elevation="1">
    <v-app-bar-title>
      <v-icon icon="mdi-api" class="mr-2" />
      API Flow
      <span v-if="activeCollection?.name" class="text-subtitle-2 ml-2"> — {{ activeCollection.name }}</span>
    </v-app-bar-title>
    <v-spacer />
    <v-btn variant="text" prepend-icon="mdi-folder-plus" @click="openNew">New Collection</v-btn>
    <v-btn variant="text" prepend-icon="mdi-import" @click="openImport">Import</v-btn>
    <v-btn variant="text" prepend-icon="mdi-export" :disabled="!activeCollection" @click="emit('export')">Export</v-btn>
    <v-btn variant="text" prepend-icon="mdi-code-json" @click="openOpenApi">Import from OpenAPI</v-btn>
  </v-app-bar>
</template>

<script setup lang="ts">
import { useDialogStore } from '@stores/useDialogStore';
import type { Collection } from '@domain/collection/Collection';
import NewCollectionDialog from './dialogs/NewCollectionDialog.vue';
import ImportCollectionDialog from './dialogs/ImportCollectionDialog.vue';
import OpenApiImportDialog from './dialogs/OpenApiImportDialog.vue';

defineProps<{ activeCollection: Collection | null }>();
const emit = defineEmits<{ (e: 'export'): void }>();

const dialog = useDialogStore();

function openNew() {
  dialog.openDialog({ component: NewCollectionDialog, title: 'New Collection', props: { noCloseButton: true } });
}

function openImport() {
  dialog.openDialog({ component: ImportCollectionDialog, title: 'Import Collection JSON', props: { noCloseButton: true } });
}

function openOpenApi() {
  dialog.openDialog({ component: OpenApiImportDialog, title: 'Import from OpenAPI', props: { noCloseButton: true } });
}
</script>
