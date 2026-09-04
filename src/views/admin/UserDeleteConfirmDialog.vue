<template>
  <v-card-text class="pt-4">
    {{ t('deleteUserConfirm', user.username) }}
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
      :loading="loading"
      @click="confirm"
    >
      {{ t('delete') }}
    </v-btn>
  </v-card-actions>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useDialogStore } from '@stores/useDialogStore';
import { useAdminStore, type AdminUser } from '@stores/useAdminStore';
import { useNotifier } from '@composables/useNotifier';
import { useLocaleStore } from '@i18n/store';

const dialog = useDialogStore();
const store = useAdminStore();
const { notify } = useNotifier();
const locale = useLocaleStore();

const props = defineProps<{
  user: AdminUser;
}>();

function t(key: string, ...args: unknown[]): string {
  let text = locale.t(key);
  if (args.length > 0 && typeof args[0] === 'string') {
    text = text.replace('{0}', args[0]);
  }
  return text;
}

const loading = ref(false);

function cancel() {
  dialog.closeDialog();
}

async function confirm() {
  loading.value = true;
  try {
    await store.deleteUser(props.user.username);
    notify(locale.t('userDeleted'), 'success');
    cancel();
  } catch {
    notify(locale.t('deleteUserFailed'), 'error');
  } finally {
    loading.value = false;
  }
}
</script>
