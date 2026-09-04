<template>
  <div>
    <v-text-field
      v-model="localUsername"
      :label="t('username')"
      autofocus
      hide-details
      class="mb-2"
    />
    <v-text-field
      v-model="currentPassword"
      :label="t('currentPassword')"
      type="password"
      hide-details
      class="mb-2"
    />
    <v-text-field
      v-model="newPassword"
      :label="t('newPassword')"
      type="password"
      :hint="t('leaveBlankToKeepCurrent')"
      persistent-hint
      hide-details
      class="mb-2"
    />
    <v-card-actions class="pa-0 mt-4">
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
        :loading="saving"
        :disabled="!canSave"
        @click="save"
      >
        {{ t('save') }}
      </v-btn>
    </v-card-actions>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useDialogStore } from '@stores/useDialogStore';
import { useNotifier } from '@composables/useNotifier';
import { useLocaleStore } from '@i18n/store';

const props = defineProps<{
  form: { username: string; password: string; currentPassword: string };
  saving: { value: boolean };
  onSave: () => Promise<void>;
}>();

const dialog = useDialogStore();
const { notify } = useNotifier();
const locale = useLocaleStore();
const t = (key: string) => locale.t(key);

const localUsername = ref(props.form.username);
const currentPassword = ref(props.form.currentPassword);
const newPassword = ref(props.form.password);
const saving = ref(props.saving.value);

watch(
  () => props.form,
  (v) => {
    localUsername.value = v.username;
    currentPassword.value = v.currentPassword;
    newPassword.value = v.password;
  },
);

watch(
  () => props.saving.value,
  (v) => (saving.value = v),
);

const canSave = computed(() => {
  if (!localUsername.value.trim()) return false;
  if (!currentPassword.value) return false;
  return true;
});

function close() {
  dialog.closeDialog();
}

async function save() {
  if (!canSave.value) return;
  saving.value = true;
  try {
    await props.onSave();
  } catch {
    notify(t('profileUpdateFailed'), 'error');
  } finally {
    saving.value = false;
  }
}
</script>
