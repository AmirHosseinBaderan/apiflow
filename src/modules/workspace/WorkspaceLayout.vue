<template>
  <v-layout>
    <WorkspaceHeader :active-collection="activeCollection" @export="onExport" />
    <CollectionsSidebar />
    <v-main>
      <TabBar v-if="showTabs" />
      <v-container fluid class="pt-6">
        <router-view />
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useTabStore } from '@stores/useTabStore';
import { CollectionExporter } from '@application/imports/CollectionExchange';
import CollectionsSidebar from '@modules/workspace/CollectionsSidebar.vue';
import WorkspaceHeader from '@modules/workspace/WorkspaceHeader.vue';
import TabBar from '@components/TabBar.vue';

const store = useCollectionStore();
const tabs = useTabStore();

const activeCollection = computed(() => store.activeCollection);
const showTabs = computed(() => tabs.tabs.length > 0);

onMounted(async () => {
  await store.refresh();
});

function onExport() {
  const c = activeCollection.value;
  if (!c) return;
  const text = new CollectionExporter().export(c);
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${c.name}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>
