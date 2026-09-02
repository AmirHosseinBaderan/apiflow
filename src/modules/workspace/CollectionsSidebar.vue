<template>
  <v-navigation-drawer permanent width="320">
    <v-list-subheader>Collections</v-list-subheader>

    <v-treeview
      v-if="tree.length > 0"
      v-model:opened="opened"
      v-model:activated="activeItemId"
      :items="tree"
      item-value="id"
      item-title="name"
      item-children="children"
      density="compact"
      activatable
      open-on-click
      @update:activated="onActivate($event as unknown[])"
    >
      <template #prepend="{ item }">
        <v-icon :icon="iconFor(item.kind)" size="small" />
      </template>
      <template #title="{ item }">
        <span
          :class="{
            'font-weight-bold': isItemActive(item),
            'text-body-2': item.kind === 'collection',
          }"
        >
          {{ item.name }}
        </span>
      </template>
      <template #append="{ item }">
        <v-menu>
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              size="x-small"
              variant="text"
              icon="mdi-dots-vertical"
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

    <v-alert v-if="tree.length === 0" type="info" variant="tonal" density="compact" class="mx-2 my-2">
      No collections yet. Create one above.
    </v-alert>

    <v-divider v-if="hasActive" />
    <div v-if="hasActive" class="pa-2">
      <v-row dense>
        <v-col>
          <v-text-field
            v-model="newRequestName"
            label="New request name"
            density="compact"
            hide-details
            @keyup.enter="addRequest"
          />
        </v-col>
      </v-row>
      <v-row dense class="mt-1">
        <v-col cols="6">
          <v-btn size="small" variant="tonal" prepend-icon="mdi-plus" block @click="addRequest">Request</v-btn>
        </v-col>
        <v-col cols="6">
          <v-btn size="small" variant="tonal" prepend-icon="mdi-folder-plus" block @click="addFolder">Folder</v-btn>
        </v-col>
      </v-row>

      <v-alert v-if="activeTree.length === 0" type="info" variant="tonal" density="compact" class="mt-2">
        This collection is empty. Use the buttons above to add a request or folder.
      </v-alert>
    </div>

    <v-dialog v-model="renameDialog.open" max-width="400">
      <v-card>
        <v-card-title>Rename Request</v-card-title>
        <v-card-text>
          <v-text-field v-model="renameDialog.name" autofocus @keyup.enter="confirmRename" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="renameDialog.open = false">Cancel</v-btn>
          <v-btn color="primary" :disabled="!renameDialog.name.trim()" @click="confirmRename">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useCollectionStore, type CollectionTreeNode } from '@stores/useCollectionStore';
import { useNotifier } from '@composables/useNotifier';

const store = useCollectionStore();
const { notify } = useNotifier();

const tree = computed(() => store.tree);
const activeTree = computed(() => store.treeForActive);
const activeItemId = ref<string | null>(null);
const activeCollectionId = computed(() => store.activeCollectionId);
const activeRequestId = computed(() => store.activeRequestId);
const hasActive = computed(() => Boolean(store.activeCollection));

const opened = ref<string[]>([]);

const newRequestName = ref('');

const renameDialog = reactive({ open: false, id: null as string | null, name: '' });

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
  if (kind === 'request') return 'mdi-file-document';
  return 'mdi-folder';
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

function onActivate(ids: unknown[]) {
  const id = Array.isArray(ids) ? ids[0] : undefined;
  if (typeof id !== 'string') return;
  const node = findNode(tree.value, id);
  if (!node) return;
  if (node.kind === 'collection') {
    store.selectCollection(id);
  } else if (node.kind === 'request') {
    store.selectRequest(id);
  }
}

async function addRequest() {
  const name = newRequestName.value.trim() || 'New Request';
  await store.createRequest(name);
  newRequestName.value = '';
  notify('Request created', 'success');
}

async function addFolder() {
  await store.createFolder('New Folder');
  notify('Folder created', 'success');
}

async function addFolderWithParent(parentId: string) {
  if (!opened.value.includes(parentId)) opened.value.push(parentId);
  await store.createFolder('New Folder', parentId);
  notify('Subfolder created', 'success');
}

async function deleteFolder(id: string) {
  await store.deleteFolder(id);
  notify('Folder deleted', 'success');
}

function renameRequest(id: string, currentName: string) {
  renameDialog.open = true;
  renameDialog.id = id;
  renameDialog.name = currentName;
}

async function confirmRename() {
  if (!renameDialog.id) return;
  const id = renameDialog.id;
  const newName = renameDialog.name.trim();
  if (!newName) return;
  const req = store.requestById(id);
  if (req) await store.updateRequest({ ...req, name: newName });
  renameDialog.open = false;
  renameDialog.id = null;
  notify('Request renamed', 'success');
}

async function deleteRequest(id: string) {
  await store.deleteRequest(id);
  notify('Request deleted', 'success');
}

async function duplicateCollection(id: string) {
  await store.duplicateCollection(id);
  notify('Collection duplicated', 'success');
}

async function removeCollection(id: string) {
  await store.deleteCollection(id);
  notify('Collection deleted', 'success');
}
</script>
