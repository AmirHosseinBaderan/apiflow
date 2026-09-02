<template>
  <div>
    <v-text-field
      v-model="url"
      label="OpenAPI URL"
      placeholder="https://example.com/swagger.json"
      density="compact"
      hide-details
      @keyup.enter="fromUrl"
    />
    <v-row dense class="mt-1">
      <v-col cols="12" sm="auto">
        <v-btn color="primary" :disabled="!url" @click="fromUrl">Import from URL</v-btn>
      </v-col>
      <v-col cols="12" sm="auto">
        <v-btn variant="tonal" @click="triggerFile">From File</v-btn>
        <input ref="fileInput" type="file" accept=".json,.yaml,.yml" hidden @change="fromFile" />
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { inject, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useDialogStore } from '@stores/useDialogStore';
import { useNotifier } from '@composables/useNotifier';
import { ServicesKey } from '@app/providers/injectKeys';
import { collectionRepository } from '@application/collections/collectionRepositoryPort';

const router = useRouter();
const store = useCollectionStore();
const dialog = useDialogStore();
const { notify } = useNotifier();
const services = inject(ServicesKey);

const url = ref('');
const fileInput = ref<HTMLInputElement | null>(null);

function close() {
  dialog.closeDialog();
}

async function importCollection(name: string, text: string) {
  const generator = services?.openApiService.importFromText(text);
  if (!generator) return;
  const coll = generator.toCollection(name);
  await collectionRepository().save(coll);
  await store.refresh();
  store.selectCollection(coll.id);
  router.replace({ name: 'collection', params: { collectionId: coll.id } });
  notify(`Imported ${coll.requests.length} requests`, 'success');
  close();
}

async function fromUrl() {
  if (!url.value) return;
  try {
    const res = await fetch(url.value);
    const text = await res.text();
    await importCollection('Imported', text);
  } catch (e) {
    notify(`OpenAPI import failed: ${(e as Error).message}`, 'error');
  }
}

async function fromFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  const text = await file.text();
  await importCollection(file.name.replace(/\.[^.]+$/, ''), text);
}

function triggerFile() {
  fileInput.value?.click();
}
</script>
