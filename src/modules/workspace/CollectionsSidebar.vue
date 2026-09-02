<template>
  <v-navigation-drawer permanent width="300">
    <v-list-subheader>Collections</v-list-subheader>
    <v-list density="compact">
      <v-list-item
        v-for="c in collections"
        :key="c.id"
        :active="c.id === activeId"
        :title="c.name"
        prepend-icon="mdi-folder"
        @click="select(c.id)"
        @contextmenu.prevent="openMenu($event, c)"
      />
    </v-list>

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

      <v-treeview
        v-model:opened="openedFolders"
        :items="tree"
        item-value="id"
        density="compact"
        class="mt-2"
        activatable
        @update:activated="onTreeActivate($event as unknown[])"
      >
        <template #prepend="{ item }">
          <v-icon :icon="item.kind === 'folder' ? 'mdi-folder' : 'mdi-file-document'" size="small" />
        </template>
        <template #title="{ item }">
          <span :class="{ 'font-weight-bold': item.kind === 'request' && item.id === activeRequestId }">
            {{ item.name }}
          </span>
        </template>
        <template #append="{ item }">
          <v-menu>
            <template #activator="{ props: act }">
              <v-btn
                v-bind="act"
                size="x-small"
                variant="text"
                icon="mdi-dots-vertical"
                @click.stop
              />
            </template>
            <v-list density="compact">
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
            </v-list>
          </v-menu>
        </template>
      </v-treeview>
    </div>

    <v-menu v-model="collectionMenu.open" :x="collectionMenu.x" :y="collectionMenu.y" absolute>
      <v-list density="compact">
        <v-list-item prepend-icon="mdi-content-duplicate" title="Duplicate" @click="duplicateCollection" />
        <v-list-item prepend-icon="mdi-delete" title="Delete" @click="removeCollection" />
      </v-list>
    </v-menu>

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
import { computed, reactive, ref } from 'vue';
import { useCollectionStore, type CollectionTreeNode } from '@stores/useCollectionStore';
import { useNotifier } from '@composables/useNotifier';

const store = useCollectionStore();
const { notify } = useNotifier();

const collections = computed(() => store.collections);
const activeId = computed(() => store.activeCollectionId);
const activeRequestId = computed(() => store.activeRequestId);
const hasActive = computed(() => Boolean(store.activeCollection));
const tree = computed(() => store.treeForActive);

const openedFolders = ref<string[]>([]);
const newRequestName = ref('');

const collectionMenu = reactive({ open: false, x: 0, y: 0, targetId: null as string | null });

const renameDialog = reactive({ open: false, id: null as string | null, name: '' });

function select(id: string) {
  store.selectCollection(id);
}

function onTreeActivate(ids: unknown[]) {
  const id = Array.isArray(ids) ? ids[0] : undefined;
  if (typeof id === 'string') {
    const node = findNode(tree.value, id);
    if (node && node.kind === 'request') store.selectRequest(id);
    else if (node && node.kind === 'collection') store.selectCollection(id);
  }
}

function findNode(nodes: readonly CollectionTreeNode[], id: string): CollectionTreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const child = findNode(n.children, id);
    if (child) return child;
  }
  return null;
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
  if (!openedFolders.value.includes(parentId)) openedFolders.value.push(parentId);
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

function openMenu(e: MouseEvent, c: { id: string }) {
  collectionMenu.open = true;
  collectionMenu.x = e.clientX;
  collectionMenu.y = e.clientY;
  collectionMenu.targetId = c.id;
}

async function duplicateCollection() {
  if (!collectionMenu.targetId) return;
  await store.duplicateCollection(collectionMenu.targetId);
  collectionMenu.open = false;
  notify('Collection duplicated', 'success');
}

async function removeCollection() {
  if (!collectionMenu.targetId) return;
  await store.deleteCollection(collectionMenu.targetId);
  collectionMenu.open = false;
  notify('Collection deleted', 'success');
}
</script>
