<template>
  <div
    v-show="tabs.tabs.length"
    class="tab-strip"
  >
    <div
      v-for="(tab, index) in tabs.tabs"
      :key="tab.id"
      :class="['tab', { active: activeId === tab.id, dragging: dragIndex === index }]"
      :title="tab.title"
      draggable="true"
      @click="select(tab)"
      @mousedown="onMouseDown(tab, $event)"
      @dragstart="onDragStart($event, index)"
      @dragover.prevent="onDragOver($event, index)"
      @drop="onDrop($event, index)"
      @dragend="onDragEnd"
    >
      <span class="tab-label">{{ tab.title }}</span>
      <div class="tab-panel-connector" />
      <v-icon
        v-if="tabs.tabs.length > 1"
        icon="mdi-close"
        size="x-small"
        class="tab-close"
        title="Close"
        @click.stop="close(tab)"
      />
    </div>
    <v-btn
      rounded="lg"
      icon="mdi-plus"
      class="new-tab"
      :title="t('newTab')"
      @click="newTab"
    />
    <div class="tab-spacer" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
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

const dragIndex = ref<number | null>(null);

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

function onMouseDown(tab: { id: string }, event: MouseEvent) {
  if (event.button === 1) {
    event.preventDefault();
    close(tab);
  }
}

function onDragStart(event: DragEvent, index: number) {
  dragIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.dropEffect = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  }
}

function onDragOver(_event: DragEvent, index: number) {
  if (dragIndex.value === null || dragIndex.value === index) return;
  tabs.reorder(dragIndex.value, index);
  dragIndex.value = index;
}

function onDrop(_event: DragEvent, _index: number) {
  dragIndex.value = null;
}

function onDragEnd() {
  dragIndex.value = null;
}
</script>

<style scoped>
.tab-strip {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  padding: 0 8px;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgb(var(--v-divider-color));
  height: 36px;
  position: sticky;
  top: 0;
  z-index: 12;
  overflow-x: auto;
  scrollbar-width: none;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.tab-strip::-webkit-scrollbar {
  display: none;
}

.tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 24px 6px 14px;
  border: 1px solid transparent;
  border-bottom: none;
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
  font-size: 0.8rem;
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
  white-space: nowrap;
  margin-right: 1px;
  background: rgb(var(--v-theme-background));
  transition:
    background-color 0.12s ease,
    box-shadow 0.12s ease,
    opacity 0.12s ease;
  user-select: none;
}

.tab:hover {
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 6%, transparent);
}

.tab.active {
  background: rgb(var(--v-theme-surface));
  border-color: rgb(var(--v-divider-color));
  border-bottom-color: transparent;
  border-bottom-width: 2px;
  box-shadow: 0 -1px 0 0 rgb(var(--v-theme-surface));
  font-weight: 600;
  z-index: 2;
}

.tab.dragging {
  opacity: 0.4;
}

.tab-panel-connector {
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 1px;
  background: transparent;
  pointer-events: none;
}

.tab-label {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
  opacity: 0.85;
}

.tab.active .tab-label {
  opacity: 1;
}

.tab-close {
  position: absolute;
  right: 4px;
  top: 4px;
  opacity: 0;
  color: rgb(var(--v-theme-on-surface));
}

.tab:hover .tab-close,
.tab.active .tab-close {
  opacity: 0.7;
}

.new-tab {
  margin-left: 4px;
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.6;
  min-width: 28px;
  width: 28px;
  height: 28px;
}

.new-tab:hover {
  opacity: 1;
}

.tab-spacer {
  flex: 1;
}
</style>
