<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col
        cols="12"
        md="8"
        lg="6"
      >
        <WorkspaceActions :active-collection="activeCollection" />
        <v-card
          variant="tonal"
          class="mt-4"
        >
          <v-card-text class="text-center pa-6">
            <div class="text-h4 font-weight-medium mb-1">
              {{ t('appTitle') }}
            </div>
            <div class="text-body-2 text-medium-emphasis">
              {{ t('selectCollection') }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row
      dense
      class="mt-3"
    >
      <v-col
        cols="12"
        sm="4"
      >
        <v-card>
          <v-card-text class="text-center pa-4">
            <div class="text-h4">
              {{ collections }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ t('collections') }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col
        cols="12"
        sm="4"
      >
        <v-card>
          <v-card-text class="text-center pa-4">
            <div class="text-h4">
              {{ requests }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ t('items') }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col
        cols="12"
        sm="4"
      >
        <v-card>
          <v-card-text class="text-center pa-4">
            <div class="text-h4">
              {{ folders }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ t('folder') }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row
      dense
      class="mt-3"
    >
      <v-col cols="12">
        <v-card v-if="activeCollection">
          <v-card-title>{{ t('collection') }}</v-card-title>
          <v-card-text>
            <strong>{{ activeCollection.name }}</strong> —
            {{ activeCollection.requests.length }} {{ t('items') }},
            {{ activeCollection.folders.length }} {{ t('folder') }}.
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCollectionStore } from '@stores/useCollectionStore';
import WorkspaceActions from '@components/WorkspaceActions.vue';
import { useLocaleStore } from '@i18n/store';

const store = useCollectionStore();
const locale = useLocaleStore();
const t = (key: string) => locale.t(key);

const activeCollection = computed(() => store.activeCollection);
const collections = computed(() => store.collections.length);
const requests = computed(() => store.collections.reduce((n, c) => n + c.requests.length, 0));
const folders = computed(() => store.collections.reduce((n, c) => n + c.folders.length, 0));
</script>
