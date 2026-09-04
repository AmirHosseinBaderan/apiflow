<template>
  <v-card-text class="pt-4">
    {{ text }}
  </v-card-text>
  <v-card-actions>
    <v-spacer />
    <v-btn
      rounded="lg"
      variant="text"
      @click="cancel"
    >
      {{ t('cancel') }}
    </v-btn>
    <v-btn
      rounded="lg"
      color="error"
      @click="confirm"
    >
      {{ t('delete') }}
    </v-btn>
  </v-card-actions>
</template>

<script setup lang="ts">
import { useDialogStore } from '@stores/useDialogStore';
import { useLocaleStore } from '@i18n/store';

const dialog = useDialogStore();
const locale = useLocaleStore();
const t = (key: string) => locale.t(key);

const props = defineProps<{
  text: string;
  onConfirm: () => Promise<void>;
}>();

function cancel() {
  dialog.closeDialog();
}

async function confirm() {
  await props.onConfirm();
  dialog.closeDialog();
}
</script>
