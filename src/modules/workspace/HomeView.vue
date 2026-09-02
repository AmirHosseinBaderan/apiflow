<template>
  <v-row>
    <v-col cols="12">
      <v-card>
        <v-card-title>API Flow</v-card-title>
        <v-card-text>Self-hosted API testing and workflow platform.</v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <v-row dense class="mt-2">
    <v-col cols="12" md="4">
      <v-card>
        <v-card-text class="text-center pa-4">
          <div class="text-h3">{{ collections }}</div>
          <div class="text-caption text-medium-emphasis">Collections</div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="12" md="4">
      <v-card>
        <v-card-text class="text-center pa-4">
          <div class="text-h3">{{ requests }}</div>
          <div class="text-caption text-medium-emphasis">Requests</div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="12" md="4">
      <v-card>
        <v-card-text class="text-center pa-4">
          <div class="text-h3">{{ folders }}</div>
          <div class="text-caption text-medium-emphasis">Folders</div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <v-row dense class="mt-2">
    <v-col cols="12">
      <v-card v-if="activeCollection" variant="tonal">
        <v-card-title>Active collection</v-card-title>
        <v-card-text>
          <strong>{{ activeCollection.name }}</strong> — {{ activeCollection.requests.length }} requests,
          {{ activeCollection.folders.length }} folders.
        </v-card-text>
      </v-card>
      <v-alert v-else type="info" variant="tonal" density="compact">
        Select or create a collection to get started.
      </v-alert>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCollectionStore } from '@stores/useCollectionStore';

const store = useCollectionStore();

const collections = computed(() => store.collections.length);
const requests = computed(() => store.collections.reduce((n, c) => n + c.requests.length, 0));
const folders = computed(() => store.collections.reduce((n, c) => n + c.folders.length, 0));
const activeCollection = computed(() => store.activeCollection);
</script>
