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
import { useTabStore } from '@stores/useTabStore';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useAuthStore } from '@stores/useAuthStore';
import { useRouter } from 'vue-router';
import AppNotifier from '@components/AppNotifier.vue';
import AppDialog from '@components/AppDialog.vue';
import { useLocaleStore } from '../i18n/store';
import { useKeyboard } from '@composables/useKeyboard';
import {authMiddleware} from "../middleware/authMiddleware";
import {settingsMiddleware} from "../middleware/settingsMiddleware";

const theme = useTheme();
const settings = useSettingsStore();
const locale = useLocaleStore();
const tabs = useTabStore();
const collections = useCollectionStore();
const auth = useAuthStore();
const router = useRouter();

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
  tabs.restore();
  collections.restoreActiveState();
  await Promise.all([authMiddleware.init(), settingsMiddleware.init()]);
  const serverSettings = settingsMiddleware.settings;
  if (serverSettings?.defaultTheme) settings.setTheme(serverSettings.defaultTheme);
  if (serverSettings?.defaultLocale) locale.setLocale(serverSettings.defaultLocale);
  if (serverSettings?.appName) {
    const title = document.querySelector('title');
    if (title) title.textContent = serverSettings.appName;
  }

  window.addEventListener('auth:logout', () => {
    auth.logout();
    router.replace({ name: 'login' });
  });
});

watch(() => settings.theme, applyTheme);
watch(() => locale.locale, applyLocale);
</script>
