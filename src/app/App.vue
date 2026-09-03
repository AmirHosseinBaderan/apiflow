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
import { useLocaleStore } from '../i18n/store';
import { useKeyboard } from '@composables/useKeyboard';

const theme = useTheme();
const settings = useSettingsStore();
const locale = useLocaleStore();

useKeyboard();

function applyTheme() {
  (theme.global as unknown as { name: { value: string } }).name.value = settings.theme;
}

function applyLocale() {
  const html = document.documentElement;
  html.lang = locale.locale;
  html.dir = locale.locale === 'fa' ? 'rtl' : 'ltr';
}

onMounted(async () => {
  applyTheme();
  applyLocale();
  await loadServerSettings();
});

watch(() => settings.theme, applyTheme);
watch(() => locale.locale, applyLocale);

async function loadServerSettings() {
  try {
    const res = await fetch('/api/settings');
    if (!res.ok) return;
    const data = await res.json();
    if (data.defaultTheme) settings.setTheme(data.defaultTheme);
    if (data.defaultLocale) locale.setLocale(data.defaultLocale);
    if (data.appName) {
      const title = document.querySelector('title');
      if (title) title.textContent = data.appName;
    }
  } catch {
    // ignore
  }
}
</script>
