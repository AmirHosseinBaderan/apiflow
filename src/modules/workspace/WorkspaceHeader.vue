<template>
  <v-app-bar density="comfortable" elevation="1">
    <v-app-bar-title @click="goHome" style="cursor: pointer">
      <v-icon icon="mdi-api" class="mr-2" />
      {{ t('appTitle') }}
      <span v-if="activeCollection?.name" class="text-subtitle-2 ml-2"> — {{ activeCollection.name }}</span>
    </v-app-bar-title>
    <v-spacer />
    <v-btn variant="text" prepend-icon="mdi-folder-plus" @click="openNew">{{ t('newCollection') }}</v-btn>
    <v-btn variant="text" prepend-icon="mdi-import" @click="openImport">{{ t('import') }}</v-btn>
    <v-btn variant="text" prepend-icon="mdi-export" :disabled="!activeCollection" @click="emit('export')">{{ t('export') }}</v-btn>
    <v-btn variant="text" prepend-icon="mdi-code-json" @click="openOpenApi">{{ t('importOpenApi') }}</v-btn>
    <v-btn variant="text" icon="mdi-cog" @click="openSettings" />
  </v-app-bar>
</template>

<script setup lang="ts">
import { defineAsyncComponent, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useDialogStore } from '@stores/useDialogStore';
import type { Collection } from '@domain/collection/Collection';
import {useLocaleStore} from "../../i18n/store";

defineProps<{ activeCollection: Collection | null }>();
const emit = defineEmits<{ (e: 'export'): void }>();

const router = useRouter();
const dialog = useDialogStore();
const locale = useLocaleStore();
const t = computed(() => (key: string) => locale.t(key));

function goHome() {
  router.push({ name: 'home' });
}

function openNew() {
  dialog.openDialog({ component: defineAsyncComponent(() => import('./dialogs/NewCollectionDialog.vue')), title: t.value('newCollection') });
}

function openImport() {
  dialog.openDialog({ component: defineAsyncComponent(() => import('./dialogs/ImportCollectionDialog.vue')), title: t.value('import') });
}

function openOpenApi() {
  dialog.openDialog({ component: defineAsyncComponent(() => import('./dialogs/OpenApiImportDialog.vue')), title: t.value('importOpenApi') });
}

function openSettings() {
  dialog.openDialog({ component: defineAsyncComponent(() => import('./dialogs/SettingsDialog.vue')), title: t.value('settings') });
}
</script>
