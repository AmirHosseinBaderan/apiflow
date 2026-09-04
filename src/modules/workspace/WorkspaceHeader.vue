<template>
  <v-app-bar
    app
    elevation="1"
  >
    <v-app-bar-title
      style="cursor: pointer"
      @click="goHome"
    >
      <v-icon
        icon="mdi-api"
        class="mr-2"
      />
      {{ t('appTitle') }}
      <span
        v-if="activeCollection?.name"
        class="text-subtitle-2 ml-2"
      >
        — {{ activeCollection.name }}</span>
    </v-app-bar-title>
    <v-spacer />
    <template v-if="auth.isAuthenticated">
      <v-btn
        v-if="auth.isAdmin"
        variant="text"
        to="/admin"
        prepend-icon="mdi-account-group"
      >
        {{ t('admin') }}
      </v-btn>
      <v-btn
        variant="text"
        prepend-icon="mdi-logout"
        @click="logout"
      >
        {{ t('logout') }}
      </v-btn>
    </template>
  </v-app-bar>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useTabStore } from '@stores/useTabStore';
import type { Collection } from '@domain/collection/Collection';
import { useLocaleStore } from '../../i18n/store';
import { useAuthStore } from '@stores/useAuthStore';

defineProps<{ activeCollection: Collection | null }>();

const router = useRouter();
const tabs = useTabStore();
const locale = useLocaleStore();
const auth = useAuthStore();
const t = computed(() => (key: string) => locale.t(key));

function goHome() {
  tabs.openRoute('home', {}, locale.t('appTitle'));
  router.push({ name: 'home' });
}

function logout() {
  auth.logout();
  router.push({ name: 'login' });
}
</script>
