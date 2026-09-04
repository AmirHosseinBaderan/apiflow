<template>
  <v-form
    ref="formRef"
    @submit.prevent="save"
  >
    <v-text-field
      v-if="!isEditMode"
      v-model="username"
      :label="t('username')"
      :rules="[(v: string) => !!v || t('required')]"
      required
      autofocus
      hide-details="auto"
    />
    <v-text-field
      v-else
      v-model="username"
      :label="t('username')"
      disabled
      hide-details
    />
    <v-text-field
      v-model="password"
      :label="t('password')"
      :hint="isEditMode ? t('leaveBlankToUpdate') : undefined"
      :persistent-hint="isEditMode"
      type="password"
      :rules="[(v: string) => isEditMode || (!!v && v.trim().length > 0) || t('required')]"
      required
      hide-details="auto"
      class="mt-2"
    />
    <v-select
      v-model="role"
      :items="roleItems"
      :label="t('role')"
      item-title="label"
      item-value="value"
      :rules="[(v: string) => !!v || t('required')]"
      required
      hide-details="auto"
      class="mt-2"
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
        :loading="loading"
        :disabled="!canSave"
        @click="save"
      >
        {{ t('save') }}
      </v-btn>
    </v-card-actions>
  </v-form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDialogStore } from '@stores/useDialogStore';
import { useAdminStore, type AdminUser } from '@stores/useAdminStore';
import { useNotifier } from '@composables/useNotifier';
import { useLocaleStore } from '@i18n/store';

const dialog = useDialogStore();
const store = useAdminStore();
const { notify } = useNotifier();
const locale = useLocaleStore();
const t = (key: string) => locale.t(key);

const props = defineProps<{
  user?: AdminUser;
}>();

const formRef = ref<InstanceType<typeof HTMLFormElement> | null>(null);
const username = ref(props.user?.username ?? '');
const password = ref('');
const role = ref<'admin' | 'user'>(props.user?.role ?? 'user');
const loading = ref(false);

const isEditMode = computed(() => !!props.user?.id);

const roleItems = [
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' },
];

const canSave = computed(() => {
  if (isEditMode.value) {
    return !!role.value;
  }
  return username.value.trim().length > 0 && password.value.trim().length > 0 && !!role.value;
});

function close() {
  dialog.closeDialog();
}

async function save() {
  if (!canSave.value) return;
  loading.value = true;
  try {
    if (isEditMode.value && props.user) {
      const data: { password?: string; role?: string } = { role: role.value };
      if (password.value) data.password = password.value;
      await store.updateUser(props.user.username, data);
      notify(t('userUpdated'), 'success');
    } else {
      await store.createUser(username.value.trim(), password.value, role.value);
      notify(t('userCreated'), 'success');
    }
    close();
  } catch {
    if (isEditMode.value) {
      notify(t('updateUserFailed'), 'error');
    } else {
      notify(t('createUserFailed'), 'error');
    }
  } finally {
    loading.value = false;
  }
}
</script>
