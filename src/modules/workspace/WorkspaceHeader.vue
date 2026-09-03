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
  </v-app-bar>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useTabStore } from '@stores/useTabStore';
import type { Collection } from '@domain/collection/Collection';
import { useLocaleStore } from '../../i18n/store';

defineProps<{ activeCollection: Collection | null }>();

const router = useRouter();
const tabs = useTabStore();
const locale = useLocaleStore();
const t = computed(() => (key: string) => locale.t(key));

function goHome() {
  tabs.openRoute('home', {}, locale.t('appTitle'));
  router.push({ name: 'home' });
}
</script>
