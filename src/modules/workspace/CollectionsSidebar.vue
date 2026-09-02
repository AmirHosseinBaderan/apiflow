<template>
  <v-navigation-drawer permanent width="320">
    <v-list-subheader>Collections</v-list-subheader>

    <v-treeview
      v-if="treeWithActions.length > 0"
      v-model:opened="opened"
      :items="treeWithActions"
      item-value="id"
      item-title="name"
      item-children="children"
      density="compact"
      activatable
      open-on-click
      @update:activated="onActivate($event as unknown[])"
    >
      <template #prepend="{ item }">
        <v-icon v-if="!item.isAction" :icon="iconFor(item.kind)" size="small" />
      </template>
      <template #title="{ item }">
        <v-sheet v-if="item.isAction" width="100%" @click.stop>
          <v-text-field
            v-model="newRequestName"
            label="New request name"
            density="compact"
            hide-details
            @keyup.enter="addRequest"
          />
          <v-row dense class="mt-1">
            <v-col cols="6">
              <v-btn
                size="small"
                variant="tonal"
                prepend-icon="mdi-plus"
                block
                @click.stop="addRequest"
                >Request</v-btn
              >
            </v-col>
            <v-col cols="6">
              <v-btn
                size="small"
                variant="tonal"
                prepend-icon="mdi-folder-plus"
                block
                @click.stop="addFolder"
                >Folder</v-btn
              >
            </v-col>
          </v-row>
          <v-alert
            v-if="activeTree.length === 0"
            type="info"
            variant="tonal"
            density="compact"
            class="mt-2"
          >
            This collection is empty. Add a request or folder to get started.
          </v-alert>
        </v-sheet>
        <span
          v-else
          :class="{
            'font-weight-bold': isItemActive(item),
            'text-body-2': item.kind === 'collection',
          }"
        >
          {{ item.name }}
        </span>
      </template>
      <template #append="{ item }">
        <v-menu v-if="!item.isAction">
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
      v-if="treeWithActions.length === 0"
      type="info"
      variant="tonal"
      density="compact"
      class="mx-2 my-2"
    >
      No collections yet. Create one above.
    </v-alert>

    <v-dialog v-model="renameDialog.open" max-width="400">
      <v-card>
        <v-card-title>Rename Request</v-card-title>
        <v-card-text>
          <v-text-field v-model="renameDialog.name" autofocus @keyup.enter="confirmRename" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="renameDialog.open = false">Cancel</v-btn>
          <v-btn color="primary" :disabled="!renameDialog.name.trim()" @click="confirmRename"
            >Save</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useCollectionStore, type CollectionTreeNode } from '@stores/useCollectionStore';
import { useNotifier } from '@composables/useNotifier';

const store = useCollectionStore();
const router = useRouter();
const { notify } = useNotifier();

const tree = computed(() => store.tree);
const activeTree = computed(() => store.treeForActive);
const activeCollectionId = computed(() => store.activeCollectionId);
const activeRequestId = computed(() => store.activeRequestId);

const opened = ref<string[]>([]);
const newRequestName = ref('');
const renameDialog = reactive({ open: false, id: null as string | null, name: '' });

const actionId = (collectionId: string) => `__action_${collectionId}`;

const treeWithActions = computed(() => {
  const activeId = activeCollectionId.value;
  if (!activeId) return tree.value;
  return tree.value.map((c) => {
    if (c.id !== activeId) return c;
    const action: CollectionTreeNode = {
      kind: 'request',
      id: actionId(activeId),
      name: '',
      parentId: activeId,
      children: [],
      isAction: true,
    };
    return { ...c, children: [action, ...c.children] };
  });
});

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
  const node = findNode(treeWithActions.value, id);
  if (!node || node.isAction) return;
  if (node.kind === 'collection') {
    store.selectCollection(id);
    router.push({ name: 'collection', params: { collectionId: id } });
  } else if (node.kind === 'request') {
    store.selectRequest(id);
    const cid = activeCollectionId.value;
    if (cid)
      router.push({ name: 'collectionRequest', params: { collectionId: cid, requestId: id } });
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
