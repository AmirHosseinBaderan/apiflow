<template>
  <v-card-text>
    <v-select
        v-model="settings.locale"
        :items="[{ value: 'en', label: 'English' }, { value: 'fa', label: 'فارسی' }]"
        item-title="label"
        item-value="value"
        :label="t('locale')"
        density="compact"
        hide-details
        class="mt-2"
    />
    <v-select
        v-model="settings.theme"
        :items="[{ value: 'light', label: t('light') }, { value: 'dark', label: t('dark') }]"
        item-title="label"
        item-value="value"
        :label="t('theme')"
        density="compact"
        hide-details
        class="mt-2"
    />
  </v-card-text>
  <v-card-actions>
    <v-spacer/>
    <v-btn text @click="close">{{ t('cancel') }}</v-btn>
  </v-card-actions>
</template>

<script setup lang="ts">
import {watch} from 'vue';
import {useDialogStore} from '@stores/useDialogStore';
import {useSettingsStore} from '@stores/useSettingsStore';
import {useLocaleStore} from "../../../i18n/store";

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
