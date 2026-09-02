<template>
  <div>
    <v-text-field
      v-model="name"
      label="New request name"
      autofocus
      density="compact"
      hide-details
      @keyup.enter="save"
    />
    <v-card-actions class="pa-0 mt-2">
      <v-spacer />
      <v-btn text @click="close">Cancel</v-btn>
      <v-btn color="primary" :disabled="!name.trim()" @click="save">Save</v-btn>
    </v-card-actions>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useDialogStore } from '@stores/useDialogStore';
import { useNotifier } from '@composables/useNotifier';

const props = defineProps<{ id: string; currentName: string }>();
const store = useCollectionStore();
const dialog = useDialogStore();
const { notify } = useNotifier();

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
  const req = store.requestById(props.id);
  if (req) await store.updateRequest({ ...req, name: n });
  notify('Request renamed', 'success');
  close();
}
</script>
