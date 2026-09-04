<template>
  <v-form
    ref="formRef"
    @submit.prevent="save"
  >
    <div class="text-subtitle-2 font-weight-medium mb-1">
      {{ t('general') }}
    </div>
    <v-text-field
      v-model="localSettings.appName"
      :label="t('appName')"
      variant="outlined"
      density="comfortable"
      class="mt-2"
      hide-details
    />
    <v-switch
      v-model="localSettings.multiUser"
      :label="t('enableMultiUser')"
      color="primary"
      inset
      class="mt-2"
    />
    <v-switch
      v-if="localSettings.multiUser"
      v-model="localSettings.forceLogin"
      :label="t('forceLogin')"
      color="primary"
      inset
      class="mt-1"
    />

    <div class="text-subtitle-2 font-weight-medium mb-1 mt-6">
      {{ t('appearance') }}
    </div>
    <v-select
      v-model="localSettings.defaultTheme"
      :items="[{ value: 'light', label: t('light') }, { value: 'dark', label: t('dark') }]"
      :label="t('theme')"
      item-title="label"
      item-value="value"
      variant="outlined"
      density="comfortable"
      class="mt-2"
      hide-details
    />
    <v-select
      v-model="localSettings.defaultLocale"
      :items="[{ value: 'en', label: 'English' }, { value: 'fa', label: 'فارسی' }]"
      :label="t('locale')"
      item-title="label"
      item-value="value"
      variant="outlined"
      density="comfortable"
      class="mt-2"
      hide-details
    />

    <v-card-actions class="pa-0 mt-6">
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
        color="primary"
        :loading="saving"
        @click="save"
      >
        {{ t('save') }}
      </v-btn>
    </v-card-actions>
  </v-form>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDialogStore } from '@stores/useDialogStore';
import { useSettingsStore } from '@stores/useSettingsStore';
import { useNotifier } from '@composables/useNotifier';
import { useLocaleStore } from '@i18n/store';
import { getSettings, updateSettings } from '../../api/calls/settings';
import type { SettingsResponse } from '../../api/calls/settings';

const dialog = useDialogStore();
const settingsStore = useSettingsStore();
const { notify } = useNotifier();
const locale = useLocaleStore();
const t = (key: string) => locale.t(key);

const saving = ref(false);
const serverSettings = ref<SettingsResponse | null>(null);
const localSettings = ref({
  appName: '',
  multiUser: false,
  forceLogin: false,
  defaultTheme: 'dark' as 'light' | 'dark',
  defaultLocale: 'en' as 'en' | 'fa',
});

onMounted(async () => {
  try {
    serverSettings.value = await getSettings();
    localSettings.value = {
      appName: serverSettings.value.appName,
      multiUser: serverSettings.value.multiUser,
      forceLogin: serverSettings.value.forceLogin,
      defaultTheme: serverSettings.value.defaultTheme,
      defaultLocale: serverSettings.value.defaultLocale,
    };
  } catch {
    notify(t('loadSettingsFailed'), 'error');
  }
});

function cancel() {
  if (serverSettings.value) {
    localSettings.value = {
      appName: serverSettings.value.appName,
      multiUser: serverSettings.value.multiUser,
      forceLogin: serverSettings.value.forceLogin,
      defaultTheme: serverSettings.value.defaultTheme,
      defaultLocale: serverSettings.value.defaultLocale,
    };
  }
  dialog.closeDialog();
}

async function save() {
  saving.value = true;
  try {
    await updateSettings({
      appName: localSettings.value.appName,
      multiUser: localSettings.value.multiUser,
      forceLogin: localSettings.value.forceLogin,
      defaultTheme: localSettings.value.defaultTheme,
      defaultLocale: localSettings.value.defaultLocale,
    });
    settingsStore.setTheme(localSettings.value.defaultTheme);
    settingsStore.setLocale(localSettings.value.defaultLocale);
    notify(t('settingsSaved'), 'success');
    dialog.closeDialog();
  } catch {
    notify(t('saveSettingsFailed'), 'error');
  } finally {
    saving.value = false;
  }
}
</script>
