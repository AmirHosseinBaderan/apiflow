<template>
  <v-navigation-drawer
    permanent
    width="280"
  >
    <div class="pa-3 sidebar-header">
      <v-text-field
        v-model="newItemName"
        label="Quick create"
        placeholder="Request or folder name..."
        hide-details
        density="compact"
        class="mb-2"
      />
      <v-row
        dense
        class="quick-actions"
      >
        <v-col cols="6">
          <v-btn
            rounded="lg"
            prepend-icon="mdi-plus"
            block
            density="comfortable"
            @click="newRequest"
          >
            Request
          </v-btn>
        </v-col>
        <v-col cols="6">
          <v-btn
            rounded="lg"
            prepend-icon="mdi-folder-plus"
            block
            density="comfortable"
            @click="newFolder"
          >
            Folder
          </v-btn>
        </v-col>
      </v-row>
    </div>

    <v-divider />

    <v-treeview
      v-if="tree.length > 0"
      v-model:opened="opened"
      :items="tree"
      item-value="id"
      item-title="name"
      item-children="children"
      density="compact"
      activatable
      open-on-click
      @update:activated="onActivate($event as string | string[])"
    >
      <template #prepend="{ item }">
        <v-icon
          v-if="!item.isAction"
          :icon="iconFor(item.kind)"
          size="small"
          class="tree-icon"
        />
      </template>
      <template #title="{ item }">
        <span
          :class="{
            'font-weight-bold': isItemActive(item),
            'tree-title': true,
          }"
          @click.stop="onActivate(item.id)"
        >
          {{ item.name }}
        </span>
      </template>
      <template #append="{ item }">
        <v-menu>
          <template #activator="{ props: act }">
            <v-btn
              rounded="lg"
              v-bind="act"
              icon="mdi-dots-vertical"
              size="x-small"
              @click.stop
            />
          </template>
          <v-list density="compact">
            <v-list-item
              v-if="item.kind === 'collection'"
              prepend-icon="mdi-content-duplicate"
              title="Duplicate"
              @click="duplicateCollection(item.id)"
            />
            <v-list-item
              v-if="item.kind === 'collection'"
              prepend-icon="mdi-delete"
              title="Delete"
              @click="removeCollection(item.id)"
            />
            <v-list-item
              v-if="item.kind === 'folder'"
              prepend-icon="mdi-folder-plus"
              title="Add subfolder"
              @click="addFolderWithParent(item.id)"
            />
            <v-list-item
              v-if="item.kind === 'folder'"
              prepend-icon="mdi-folder-remove"
              title="Delete folder"
              @click="deleteFolder(item.id)"
            />
            <v-list-item
              v-if="item.kind === 'request'"
              prepend-icon="mdi-pencil"
              title="Rename"
              @click="renameRequest(item.id, item.name)"
            />
            <v-list-item
              v-if="item.kind === 'request'"
              prepend-icon="mdi-trash-can"
              title="Delete"
              @click="deleteRequest(item.id)"
            />
          </v-list>
        </v-menu>
      </template>
    </v-treeview>

    <v-alert
      v-if="tree.length === 0"
      type="info"
      variant="tonal"
      density="compact"
      class="mx-3 my-3"
    >
      No collections yet. Use "New Collection" on the home page.
    </v-alert>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch, defineAsyncComponent } from 'vue';
import { useRouter } from 'vue-router';
import { useCollectionStore, type CollectionTreeNode } from '@stores/useCollectionStore';
import { useDialogStore } from '@stores/useDialogStore';
import { useTabStore } from '@stores/useTabStore';
import { useNotifier } from '@composables/useNotifier';
import { useLocaleStore } from '@i18n/store';

const store = useCollectionStore();
const tabs = useTabStore();
const router = useRouter();
const dialog = useDialogStore();
const locale = useLocaleStore();
const { notify } = useNotifier();

  const t = (key: string) => locale.t(key);

const tree = computed(() => store.tree);
const activeCollectionId = computed(() => store.activeCollectionId);
const activeRequestId = computed(() => store.activeRequestId);

const opened = ref<string[]>([]);
const newItemName = ref('');

watch(
  () => store.activeCollectionId,
  (id) => {
    if (!id) {
      opened.value = [];
      return;
    }
    const c = store.activeCollection;
    opened.value = [id, ...(c?.folders.map((f) => f.id) ?? [])];
  },
  { immediate: true },
);

function iconFor(kind: CollectionTreeNode['kind']) {
  if (kind === 'request') return 'mdi-file-document-outline';
  return 'mdi-folder-outline';
}

function isItemActive(item: CollectionTreeNode) {
  if (item.kind === 'request') return item.id === activeRequestId.value;
  if (item.kind === 'collection') return item.id === activeCollectionId.value;
  return false;
}

function findNode(nodes: readonly CollectionTreeNode[], id: string): CollectionTreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const child = findNode(n.children, id);
    if (child) return child;
  }
  return null;
}

function onActivate(ids: string | string[]) {
  const id = Array.isArray(ids) ? ids.at(-1) : ids;
  if (typeof id !== 'string') return;
  const node = findNode(tree.value, id);
  if (!node) return;
  if (node.kind === 'collection') {
    store.selectCollection(id);
    tabs.openRoute('collection', { collectionId: id }, node.name);
    router.push({ name: 'collection', params: { collectionId: id } });
  } else if (node.kind === 'folder') {
    const cid = store.ownerCollectionId(id);
    if (cid) {
      store.selectCollection(cid);
      tabs.openRoute('node', { collectionId: cid, folderId: id }, node.name);
      router.push({ name: 'node', params: { collectionId: cid, folderId: id } });
    }
  } else if (node.kind === 'request') {
    const cid = store.ownerCollectionId(id);
    if (cid) {
      store.selectCollection(cid);
      store.selectRequest(id);
      tabs.openRoute('request', { collectionId: cid, requestId: id }, node.name);
      router.push({ name: 'request', params: { collectionId: cid, requestId: id } });
    }
  }
}

function requireActiveOrPick(itemType: 'request' | 'folder'): string | null {
  if (store.activeCollectionId) return store.activeCollectionId;
  dialog.openDialog({
    component: defineAsyncComponent(() => import('./dialogs/CollectionPickerDialog.vue')),
    title: t('pickCollection'),
    props: { itemType, name: newItemName.value },
  });
  return null;
}

async function newRequest() {
  const name = newItemName.value.trim() || 'New Request';
  const req = await store.createUnsortedRequest(name);
  notify(t('requestCreated'), 'success');
  if (req) {
    tabs.openRoute('request', { collectionId: '__unsorted__', requestId: req.id }, name);
    router.push({ name: 'request', params: { collectionId: '__unsorted__', requestId: req.id } });
  }
  newItemName.value = '';
}

async function newFolder() {
  const name = newItemName.value.trim() || 'New Folder';
  const cid = requireActiveOrPick('folder');
  if (!cid) return;
  await store.createFolder(name);
  const folderId = store.activeCollection?.folders.find((f) => f.name === name)?.id ?? null;
  notify(t('folderCreated'), 'success');
  if (folderId) {
    tabs.openRoute('node', { collectionId: cid, folderId: folderId }, name);
    router.push({ name: 'node', params: { collectionId: cid, folderId: folderId } });
  } else {
    tabs.openRoute('collection', { collectionId: cid }, store.activeCollection?.name ?? name);
    router.push({ name: 'collection', params: { collectionId: cid } });
  }
  newItemName.value = '';
}

async function addFolderWithParent(parentId: string) {
  if (!opened.value.includes(parentId)) opened.value.push(parentId);
  await store.createFolder('New Folder', parentId);
  notify(t('subfolderCreated'), 'success');
}

async function deleteFolder(id: string) {
  await store.deleteFolder(id);
  notify(t('folderDeleted'), 'success');
}

function renameRequest(id: string, currentName: string) {
  dialog.openDialog({
    component: defineAsyncComponent(() => import('./dialogs/RenameDialog.vue')),
    title: t('renameRequest'),
    props: {
      label: t('name'),
      currentName,
      onSave: async (name: string) => {
        const req = store.requestById(id);
        if (req) await store.updateRequest({ ...req, name });
      },
    },
  });
}

async function deleteRequest(id: string) {
  await store.deleteRequest(id);
  notify(t('requestDeleted'), 'success');
}

async function duplicateCollection(id: string) {
  await store.duplicateCollection(id);
  notify(t('collectionDuplicated'), 'success');
}

async function removeCollection(id: string) {
  await store.deleteCollection(id);
  notify(t('collectionDeleted'), 'success');
}
</script>

<style scoped lang="scss">
.sidebar-header {
  padding-bottom: 8px;
}

.quick-actions {
  .v-col {
    padding-top: 4px;
    padding-bottom: 4px;
  }
}

.tree-icon {
  margin-right: 4px;
}

.tree-title {
  font-size: 0.875rem;
  line-height: 1.4;
}
</style>
