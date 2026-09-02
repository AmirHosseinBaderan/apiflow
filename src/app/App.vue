<template>
  <v-app>
    <router-view />
    <AppNotifier />
  </v-app>
</template>

<script setup lang="ts">
import AppNotifier from '@components/AppNotifier.vue';
</script>