<template>
  <v-navigation-drawer permanent width="280">
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
      <v-text-field
        v-model="newRequestName"
        label="New request name"
        density="compact"
        hide-details
        @keyup.enter="addRequest"
      />
      <v-btn class="mt-1" size="small" variant="tonal" prepend-icon="mdi-plus" @click="addRequest">Add Request</v-btn>
      <v-treeview
        v-model:opened="openedFolders"
        :items="tree"
        item-value="id"
        density="compact"
        class="mt-2"
      >
        <template #prepend="{ item }">
          <v-icon :icon="item.kind === 'folder' ? 'mdi-folder' : 'mdi-file-document'" size="small" />
        </template>
        <template #append="{ item }">
          <v-btn
            v-if="item.kind === 'request'"
            size="x-small"
            variant="text"
            icon="mdi-cursor-pointer"
            @click.stop="selectRequest(item.id)"
          />
        </template>
      </v-treeview>
    </div>

    <v-menu v-model="menu.open" :x="menu.x" :y="menu.y" absolute>
      <v-list density="compact">
        <v-list-item prepend-icon="mdi-content-duplicate" title="Duplicate" @click="duplicate" />
        <v-list-item prepend-icon="mdi-delete" title="Delete" @click="remove" />
      </v-list>
    </v-menu>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useNotifier } from '@composables/useNotifier';
import { CollectionImporter } from '@application/imports/CollectionExchange';

const store = useCollectionStore();
const { notify } = useNotifier();

const collections = computed(() => store.collections);
const activeId = computed(() => store.activeCollectionId);
const hasActive = computed(() => Boolean(store.activeCollection));
const tree = computed(() => store.treeForActive);

const openedFolders = ref<string[]>([]);
const newRequestName = ref('');

const menu = reactive({ open: false, x: 0, y: 0, targetId: null as string | null });

function select(id: string) {
  store.selectCollection(id);
}

function selectRequest(id: string) {
  store.selectRequest(id);
}

async function addRequest() {
  const name = newRequestName.value.trim() || 'New Request';
  await store.createRequest(name);
  newRequestName.value = '';
  notify('Request created', 'success');
}

function openMenu(e: MouseEvent, c: { id: string }) {
  menu.open = true;
  menu.x = e.clientX;
  menu.y = e.clientY;
  menu.targetId = c.id;
}

async function duplicate() {
  if (!menu.targetId) return;
  await store.duplicateCollection(menu.targetId);
  menu.open = false;
  notify('Collection duplicated', 'success');
}

async function remove() {
  if (!menu.targetId) return;
  await store.deleteCollection(menu.targetId);
  menu.open = false;
  notify('Collection deleted', 'success');
}

void CollectionImporter;
</script>