<template>
  <div class="workspace-actions d-flex flex-wrap gap-2 align-center">
    <v-btn
      rounded="lg"
      prepend-icon="mdi-folder-plus"
      @click="openNew"
    >
      {{ t('newCollection') }}
    </v-btn>
    <v-btn
      rounded="lg"
      prepend-icon="mdi-import"
      @click="openImport"
    >
      {{ t('import') }}
    </v-btn>
    <v-btn
      rounded="lg"
      prepend-icon="mdi-export"
      :disabled="!activeCollection"
      @click="onExport"
    >
      {{ t('export') }}
    </v-btn>
    <v-btn
      rounded="lg"
      prepend-icon="mdi-code-json"
      @click="openOpenApi"
    >
      {{ t('importOpenApi') }}
    </v-btn>
    <v-spacer />
    <v-btn
      rounded="lg"
      icon="mdi-cog"
      :title="t('settings')"
      @click="openSettings"
    />
    <v-btn
      rounded="lg"
      icon="mdi-help"
      :title="t('shortcuts')"
      @click="openShortcuts"
    />
  </div>
</template>

  <script setup lang="ts">
import { defineAsyncComponent, computed } from 'vue';
import { useDialogStore } from '@stores/useDialogStore';
import { CollectionExporter } from '@application/imports/CollectionExchange';
import type { Collection } from '@domain/collection/Collection';
import { useLocaleStore } from '@i18n/store';

const props = defineProps<{ activeCollection: Collection | null }>();

const dialog = useDialogStore();
const locale = useLocaleStore();
const t = computed(() => (key: string) => locale.t(key));

function openNew() {
  dialog.openDialog({
    component: defineAsyncComponent(() => import('@modules/workspace/dialogs/NewCollectionDialog.vue')),
    title: t.value('newCollection'),
  });
}

function openImport() {
  dialog.openDialog({
    component: defineAsyncComponent(() => import('@modules/workspace/dialogs/ImportCollectionDialog.vue')),
    title: t.value('import'),
  });
}

function openOpenApi() {
  dialog.openDialog({
    component: defineAsyncComponent(() => import('@modules/workspace/dialogs/OpenApiImportDialog.vue')),
    title: t.value('importOpenApi'),
  });
}

function openSettings() {
  dialog.openDialog({
    component: defineAsyncComponent(() => import('@modules/workspace/dialogs/SettingsDialog.vue')),
    title: t.value('settings'),
  });
}

function openShortcuts() {
  dialog.openDialog({
    component: defineAsyncComponent(() => import('@modules/workspace/dialogs/ShortcutsDialog.vue')),
    title: t.value('shortcuts'),
  });
}

function onExport() {
  const c = props.activeCollection;
  if (!c) return;
  const text = new CollectionExporter().export(c);
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${c.name}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<style scoped lang="scss">
.workspace-actions {
  max-width: 100%;
}
</style>
