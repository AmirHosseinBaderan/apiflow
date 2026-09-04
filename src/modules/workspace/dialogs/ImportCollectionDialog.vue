<template>
  <div>
    <v-textarea
      v-model="text"
      rows="10"
      :placeholder="t('pasteCollectionJson')"
      hide-details
      @update:model-value="err = null"
    />
    <v-alert
      v-if="err"
      type="error"
      variant="tonal"
      density="compact"
    >
      {{ err }}
    </v-alert>
    <v-card-actions class="pa-0 mt-2">
      <v-spacer />
      <v-btn
        rounded="lg"
        @click="close"
      >
        Cancel
      </v-btn>
      <v-btn
        rounded="lg"
        color="primary"
        :disabled="!text.trim()"
        @click="importCollection"
      >
        Import
      </v-btn>
    </v-card-actions>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useDialogStore } from '@stores/useDialogStore';
import { useNotifier } from '@composables/useNotifier';
import { CollectionImporter } from '@application/imports/CollectionExchange';
import { collectionRepository } from '@application/collections/collectionRepositoryPort';
import { useLocaleStore } from '@i18n/store';

const router = useRouter();
const store = useCollectionStore();
const dialog = useDialogStore();
const { notify } = useNotifier();
const locale = useLocaleStore();
const t = (key: string) => locale.t(key);

const text = ref('');
const err = ref<string | null>(null);

function close() {
  dialog.closeDialog();
}

async function importCollection() {
  try {
    const c = new CollectionImporter().import(text.value);
    await collectionRepository().save(c);
    await store.refresh();
    store.selectCollection(c.id);
    router.replace({ name: 'collection', params: { collectionId: c.id } });
    notify(t('importCollection'), 'success');
    close();
  } catch (e) {
    err.value = (e as Error).message;
  }
}
</script>
