<template>
  <v-layout>
    <WorkspaceHeader
      :active-collection="activeCollection"
      @create="onCreate"
      @import="onImport"
      @export="onExport"
    />
    <CollectionsSidebar />
    <v-main>
      <v-container fluid class="pt-6">
        <router-view />
      </v-container>
    </v-main>

    <v-dialog v-model="importDialog" max-width="500">
      <v-card>
        <v-card-title>Import Collection JSON</v-card-title>
        <v-card-text>
          <v-textarea v-model="importText" rows="10" placeholder="Paste collection JSON here" />
          <v-alert v-if="importError" type="error" variant="tonal">{{ importError }}</v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="importDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="confirmImport">Import</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="openApiDialog" max-width="500">
      <v-card>
        <v-card-title>Import from OpenAPI</v-card-title>
        <v-card-text>
          <v-text-field v-model="openApiUrl" label="OpenAPI URL" placeholder="https://example.com/swagger.json" />
          <v-btn color="primary" :disabled="!openApiUrl" @click="importOpenApi">Import from URL</v-btn>
          <v-btn class="ml-2" variant="tonal" @click="triggerOpenApiFile">From File</v-btn>
          <input ref="openApiInput" type="file" accept=".json,.yaml,.yml" hidden @change="onOpenApiFile" />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import WorkspaceHeader from './WorkspaceHeader.vue';
import CollectionsSidebar from './CollectionsSidebar.vue';
import { useCollectionStore } from '@stores/useCollectionStore';
import { CollectionImporter, CollectionExporter } from '@application/imports/CollectionExchange';
import { collectionRepository } from '@application/collections/collectionRepositoryPort';
import { useNotifier } from '@composables/useNotifier';
import { ServicesKey } from '@app/providers/injectKeys';

const store = useCollectionStore();
const router = useRouter();
const { notify } = useNotifier();
const services = inject(ServicesKey);

const activeCollection = computed(() => store.activeCollection);

const importDialog = ref(false);
const importText = ref('');
const importError = ref<string | null>(null);
const openApiDialog = ref(false);
const openApiUrl = ref('');
const openApiInput = ref<HTMLInputElement | null>(null);

onMounted(async () => {
  await store.refresh();
  if (!store.activeCollectionId && store.collections[0]) {
    const id = store.collections[0]!.id;
    store.selectCollection(id);
    router.replace({ name: 'collection', params: { collectionId: id } });
  }
});

function onCreate(name: string) {
  store.createCollection(name).then(() => {
    notify('Collection created', 'success');
    if (store.activeCollectionId) router.replace({ name: 'collection', params: { collectionId: store.activeCollectionId } });
  });
}

function onImport() {
  importText.value = '';
  importError.value = null;
  importDialog.value = true;
}

async function confirmImport() {
  try {
    const c = new CollectionImporter().import(importText.value);
    await collectionRepository().save(c);
    await store.refresh();
    store.selectCollection(c.id);
    router.replace({ name: 'collection', params: { collectionId: c.id } });
    importDialog.value = false;
    notify('Collection imported', 'success');
  } catch (e) {
    importError.value = (e as Error).message;
  }
}

function onExport() {
  if (!activeCollection.value) return;
  const text = new CollectionExporter().export(activeCollection.value);
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${activeCollection.value.name}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function triggerOpenApiFile() {
  openApiInput.value?.click();
}

async function onOpenApiFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const text = await file.text();
  const generator = services?.openApiService.importFromText(text);
  if (!generator) return;
  const coll = generator.toCollection(file.name.replace(/\.[^.]+$/, ''));
  await collectionRepository().save(coll);
  await store.refresh();
  store.selectCollection(coll.id);
  router.replace({ name: 'collection', params: { collectionId: coll.id } });
  notify(`Imported ${coll.requests.length} requests from OpenAPI`, 'success');
}

async function importOpenApi() {
  if (!openApiUrl.value) return;
  try {
    const res = await fetch(openApiUrl.value);
    const text = await res.text();
    const generator = services?.openApiService.importFromText(text);
    if (!generator) return;
    const coll = generator.toCollection('Imported');
    await collectionRepository().save(coll);
    await store.refresh();
    store.selectCollection(coll.id);
    router.replace({ name: 'collection', params: { collectionId: coll.id } });
    openApiDialog.value = false;
    notify(`Imported ${coll.requests.length} requests`, 'success');
  } catch (e) {
    notify(`OpenAPI import failed: ${(e as Error).message}`, 'error');
  }
}
</script>
