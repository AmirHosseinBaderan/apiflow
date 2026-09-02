<template>
  <v-app-bar density="comfortable" elevation="1">
    <v-app-bar-title>
      <v-icon icon="mdi-api" class="mr-2" />
      API Flow
    </v-app-bar-title>
    <v-spacer />
    <v-btn variant="text" prepend-icon="mdi-folder-plus" @click="openNew">New Collection</v-btn>
    <v-btn variant="text" prepend-icon="mdi-import" @click="emit('import')">Import</v-btn>
    <v-btn variant="text" prepend-icon="mdi-export" :disabled="!activeCollection" @click="emit('export')">Export</v-btn>
  </v-app-bar>

  <v-dialog v-model="dialog" max-width="400">
    <v-card>
      <v-card-title>New Collection</v-card-title>
      <v-card-text>
        <v-text-field v-model="name" label="Collection name" autofocus @keyup.enter="create" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="dialog = false">Cancel</v-btn>
        <v-btn color="primary" :disabled="!name.trim()" @click="create">Create</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Collection } from '@domain/collection/Collection';

defineProps<{ activeCollection: Collection | null }>();
const emit = defineEmits<{
  (e: 'create', name: string): void;
  (e: 'import'): void;
  (e: 'export'): void;
}>();

const dialog = ref(false);
const name = ref('');

function openNew() {
  name.value = '';
  dialog.value = true;
}

function create() {
  if (!name.value.trim()) return;
  const n = name.value.trim();
  dialog.value = false;
  emit('create', n);
}
</script>