<template>
  <v-container
    v-if="tabs.tabs.length"
    fluid
    class="tab-bar pa-0"
  >
    <div class="d-flex align-center mx-2">
      <v-btn
        v-for="tab in tabs.tabs"
        :key="tab.id"
        :color="activeId === tab.id ? 'primary' : undefined"
        :variant="activeId === tab.id ? 'flat' : 'text'"
        size="small"
        class="tab-item mr-1"
        :title="tab.title"
        @click="select(tab)"
      >
        {{ tab.title }}
        <v-icon
          v-if="tabs.tabs.length > 1"
          icon="mdi-close"
          size="small"
          class="ml-1"
          @click.stop="close(tab)"
        />
      </v-btn>
      <v-btn
        icon="mdi-plus"
        size="small"
        variant="text"
        :title="t('newTab')"
        @click="newTab"
      />
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useTabStore } from '@stores/useTabStore';
import { useLocaleStore } from '@i18n/store';

const router = useRouter();
const route = useRoute();
const tabs = useTabStore();
const locale = useLocaleStore();
const t = (key: string) => locale.t(key);

const activeId = computed(() => {
  const p = route.params;
  const meta: Record<string, string | undefined> = {
    collectionId: typeof p.collectionId === 'string' ? p.collectionId : undefined,
    folderId: typeof p.folderId === 'string' ? p.folderId : undefined,
    requestId: typeof p.requestId === 'string' ? p.requestId : undefined,
    workflowId: typeof p.workflowId === 'string' ? p.workflowId : undefined,
  };
  const match = tabs.tabs.find(
    (tb) =>
      tb.meta.collectionId === meta.collectionId &&
      tb.meta.folderId === meta.folderId &&
      tb.meta.requestId === meta.requestId &&
      tb.meta.workflowId === meta.workflowId,
  );
  return match?.id ?? tabs.activeTabId;
});

function select(tab: { id: string; route: unknown }) {
  tabs.activate(tab.id);
  router.push(tab.route as Parameters<typeof router.push>[0]);
}

function close(tab: { id: string }) {
  tabs.remove(tab.id);
  const next = tabs.activeTab;
  if (next?.route) router.push(next.route as Parameters<typeof router.push>[0]);
}

function newTab() {
  const tab = tabs.open({
    title: t('home'),
    kind: 'home',
    meta: {},
    route: { name: 'home' },
  });
  router.push(tab.route as Parameters<typeof router.push>[0]);
}
</script>

<style scoped>
.tab-bar {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
.tab-item {
  border-radius: 4px 4px 0 0;
}
</style>
