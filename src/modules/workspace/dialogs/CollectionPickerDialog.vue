<template>
  <div>
    <v-list
      density="compact"
      class="py-0"
    >
      <v-list-item
        v-for="c in collections"
        :key="c.id"
        :title="c.name"
        :value="c.id"
        @click="pick(c.id)"
      >
        <template #prepend>
          <v-icon
            icon="mdi-folder"
            size="small"
          />
        </template>
      </v-list-item>
      <v-list-item
        v-if="!collections.length"
        :title="t('noCollections')"
        value=""
      />
    </v-list>
    <v-divider class="my-2" />
    <v-btn
      rounded="lg"
      prepend-icon="mdi-folder-plus"
      block
      @click="pickNewCollection"
    >
      {{ t('newCollection') }}
    </v-btn>
    <v-card-actions class="pa-0 mt-2">
      <v-spacer />
      <v-btn
        rounded="lg"
        @click="close"
      >
        {{ t('cancel') }}
      </v-btn>
    </v-card-actions>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import { useRouter } from 'vue-router';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useDialogStore } from '@stores/useDialogStore';
import { useNotifier } from '@composables/useNotifier';
import { useLocaleStore } from '@i18n/store';

const props = defineProps<{ itemType: 'request' | 'folder'; name: string }>();
const router = useRouter();
const store = useCollectionStore();
const dialog = useDialogStore();
const { notify } = useNotifier();
const locale = useLocaleStore();
const t = (key: string) => locale.t(key);

const NewCollectionDialog = defineAsyncComponent(() => import('./NewCollectionDialog.vue'));

const collections = computed(() => store.collections);

function close() {
  dialog.closeDialog();
}

async function doCreate(collectionId: string) {
  store.selectCollection(collectionId);
  if (props.itemType === 'request') {
    await store.createRequest(props.name);
    if (store.activeRequestId) router.replace({ name: 'request', params: { collectionId, requestId: store.activeRequestId } });
  } else {
    await store.createFolder(props.name);
    router.replace({ name: 'collection', params: { collectionId } });
  }
  close();
}

function pick(id: string) {
  if (!id) return;
  doCreate(id);
}

function pickNewCollection() {
  dialog.closeDialog();
  dialog.openDialog({
    component: NewCollectionDialog,
    title: t('newCollection'),
  });
  notify(t('pickOrCreateCollection'), 'info');
}
</script>
