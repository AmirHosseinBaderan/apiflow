<template>
  <v-layout>
    <WorkspaceHeader :active-collection="activeCollection" />
    <CollectionsSidebar />
    <v-main class="overflow-y-auto">
      <TabBar v-if="showTabs" />
      <v-container
        fluid
        class="pt-6"
      >
        <router-view />
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useTabStore } from '@stores/useTabStore';
import CollectionsSidebar from '@modules/workspace/CollectionsSidebar.vue';
import WorkspaceHeader from '@modules/workspace/WorkspaceHeader.vue';
import TabBar from '@components/TabBar.vue';

const store = useCollectionStore();
const tabs = useTabStore();
const route = useRoute();

const activeCollection = computed(() => store.activeCollection);
const showTabs = computed(() => tabs.tabs.length > 0);

function syncTabFromRoute() {
  const params = route.params as Record<string, string | undefined>;
  const name = route.name as string | undefined;
  if (!name) return;
  const title = params.collectionId
    ? store.collections.find((c) => c.id === params.collectionId)?.name ?? 'Collection'
    : 'Home';
  tabs.openRoute(name, params, title);
}

onMounted(async () => {
  await store.refresh();
  tabs.restore();
  syncTabFromRoute();
});

watch(
  () => route.name,
  () => {
    syncTabFromRoute();
  },
);
</script>
