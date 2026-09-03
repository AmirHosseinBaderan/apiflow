<template>
  <v-layout>
    <WorkspaceHeader :active-collection="activeCollection" />
    <CollectionsSidebar />
    <v-main>
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
import { computed, onMounted } from 'vue';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useTabStore } from '@stores/useTabStore';
import CollectionsSidebar from '@modules/workspace/CollectionsSidebar.vue';
import WorkspaceHeader from '@modules/workspace/WorkspaceHeader.vue';
import TabBar from '@components/TabBar.vue';

const store = useCollectionStore();
const tabs = useTabStore();

const activeCollection = computed(() => store.activeCollection);
const showTabs = computed(() => tabs.tabs.length > 0);

onMounted(async () => {
  await store.refresh();
  tabs.open({ title: 'Home', kind: 'home', meta: {}, route: { name: 'home' } });
});
</script>
