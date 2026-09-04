<template>
  <v-card-text>
    <v-text-field
      v-model="name"
      :label="t('workflowName')"
      hide-details
      autofocus
    />
    <v-text-field
      v-model="description"
      :label="t('workflowDescription')"
      hide-details
      class="mt-1"
    />
  </v-card-text>
  <v-card-actions>
    <v-spacer />
    <v-btn
      rounded="lg"
      @click="close"
    >
      {{ t('cancel') }}
    </v-btn>
    <v-btn
      rounded="lg"
      color="primary"
      :disabled="!name.trim()"
      @click="create"
    >
      {{ t('add') }}
    </v-btn>
  </v-card-actions>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useDialogStore } from '@stores/useDialogStore';
import { useLocaleStore } from '@i18n/store';
import { createId } from '@shared/id';

const router = useRouter();
const store = useCollectionStore();
const dialog = useDialogStore();
const locale = useLocaleStore();
const t = (key: string) => locale.t(key);

const name = ref('');
const description = ref('');

function close() {
  dialog.closeDialog();
}

async function create() {
  const n = name.value.trim();
  if (!n) return;
  const cid = store.activeCollectionId;
  if (!cid) return close();
  const wf = {
    id: createId('wf'),
    name: n,
    description: description.value.trim() || undefined,
    steps: [],
  };
  await store.saveWorkflows([...(store.activeCollection?.workflows ?? []), wf]);
  close();
  router.push({ name: 'workflow', params: { collectionId: cid, workflowId: wf.id } });
}
</script>
