<template>
  <div>
    <v-select
      v-model="settings.locale"
      :items="[{ value: 'en', label: 'English' }, { value: 'fa', label: 'فارسی' }]"
      item-title="label"
      item-value="value"
      :label="t('locale')"
      hide-details
      class="mt-2"
    />
    <v-select
      v-model="settings.theme"
      :items="[{ value: 'light', label: t('light') }, { value: 'dark', label: t('dark') }]"
      item-title="label"
      item-value="value"
      :label="t('theme')"
      hide-details
      class="mt-2"
    />
    <div class="pa-0 mt-4">
      <v-btn
        rounded="lg"
        @click="close"
      >
        {{ t('cancel') }}
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useDialogStore } from '@stores/useDialogStore';
import { useSettingsStore } from '@stores/useSettingsStore';
import { useLocaleStore } from '@i18n/store';

const dialog = useDialogStore();
const settings = useSettingsStore();
const locale = useLocaleStore();
const t = (key: string) => locale.t(key);

watch(
  () => settings.locale,
  (v) => locale.setLocale(v),
);

function close() {
  dialog.closeDialog();
}
</script>
