<template>
  <v-app-bar density="comfortable" elevation="1">
    <v-app-bar-title @click="goHome" style="cursor: pointer">
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
import { defineAsyncComponent } from 'vue';
import { useRouter } from 'vue-router';
import { useDialogStore } from '@stores/useDialogStore';
import type { Collection } from '@domain/collection/Collection';

defineProps<{ activeCollection: Collection | null }>();
const emit = defineEmits<{ (e: 'export'): void }>();

const router = useRouter();
const dialog = useDialogStore();

function goHome() {
  router.push({ name: 'home' });
}

function openNew() {
  dialog.openDialog({ component: defineAsyncComponent(() => import('./dialogs/NewCollectionDialog.vue')), title: 'New Collection' });
}

function openImport() {
  dialog.openDialog({ component: defineAsyncComponent(() => import('./dialogs/ImportCollectionDialog.vue')), title: 'Import Collection JSON' });
}

function openOpenApi() {
  dialog.openDialog({ component: defineAsyncComponent(() => import('./dialogs/OpenApiImportDialog.vue')), title: 'Import from OpenAPI' });
}
</script>
