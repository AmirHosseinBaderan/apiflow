<template>
  <v-app>
    <router-view />
    <AppNotifier />
    <AppDialog />
  </v-app>
</template>

<script setup lang="ts">
import { useTheme } from 'vuetify';
import { watch, onMounted } from 'vue';
import { useSettingsStore } from '@stores/useSettingsStore';
import AppNotifier from '@components/AppNotifier.vue';
import AppDialog from '@components/AppDialog.vue';
import {useLocaleStore} from "../i18n/store";

const theme = useTheme();
const settings = useSettingsStore();
const locale = useLocaleStore();

function applyTheme() {
  theme.global.name = settings.theme;
}

function applyLocale() {
  const html = document.documentElement;
  html.lang = locale.locale;
  html.dir = locale.locale === 'fa' ? 'rtl' : 'ltr';
}

onMounted(() => {
  applyTheme();
  applyLocale();
});

watch(() => settings.theme, applyTheme);
watch(() => locale.locale, applyLocale);
</script>
