<template>
  <v-app>
    <router-view />
    <AppNotifier />
    <AppDialog />
  </v-app>
</template>

<script setup lang="ts">
import AppNotifier from '@components/AppNotifier.vue';
import AppDialog from '@components/AppDialog.vue';
</script>
