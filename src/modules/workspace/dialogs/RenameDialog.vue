<template>
  <div>
    <v-text-field
      v-model="name"
      :label="label"
      autofocus
      hide-details
      @keyup.enter="save"
    />
    <v-card-actions class="pa-0 mt-2">
      <v-spacer />
      <v-btn
        rounded="lg"
        variant="text"
        @click="close"
      >
        {{ t('cancel') }}
      </v-btn>
      <v-btn
        rounded="lg"
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
import { useDialogStore } from '@stores/useDialogStore';
import { useNotifier } from '@composables/useNotifier';
import { useLocaleStore } from '@i18n/store';

const props = defineProps<{
  label: string;
  currentName: string;
  onSave: (name: string) => Promise<void>;
}>();

const dialog = useDialogStore();
const { notify } = useNotifier();
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
  try {
    await props.onSave(n);
    notify('Renamed successfully', 'success');
    close();
  } catch {
    notify('Rename failed', 'error');
  }
}
</script>
