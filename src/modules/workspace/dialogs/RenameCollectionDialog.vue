<template>
  <div>
    <v-text-field
      v-model="name"
      :label="t('newCollectionName')"
      autofocus
      hide-details
      @keyup.enter="save"
    />
    <v-card-actions class="pa-0 mt-2">
      <v-spacer />
      <v-btn @click="close">
        {{ t('cancel') }}
      </v-btn>
      <v-btn
        color="primary"
        :disabled="!name.trim()"
        @click="save"
      >
        {{ t('save') }}
      </v-btn>
    </v-card-actions>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useDialogStore } from '@stores/useDialogStore';
import { useNotifier } from '@composables/useNotifier';
import { useLocaleStore } from '@i18n/store';

const props = defineProps<{ id: string; currentName: string }>();
const store = useCollectionStore();
const dialog = useDialogStore();
const notifier = useNotifier();
const locale = useLocaleStore();
const t = (key: string) => locale.t(key);

const name = ref(props.currentName);

watch(
  () => props.currentName,
  (v) => (name.value = v),
);

function close() {
  dialog.closeDialog();
}

async function save() {
  const n = name.value.trim();
  if (!n) return;
  await store.renameCollection(props.id, n);
  notifier.notify('Collection renamed', 'success');
  close();
}
</script>
