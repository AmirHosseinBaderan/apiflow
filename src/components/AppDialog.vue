<template>
  <v-dialog v-model="open" width="700" persistent>
    <template v-if="spec">
      <v-card>
        <v-card-title v-if="spec.title">{{ spec.title }}</v-card-title>
        <v-card-text>
          <component :is="spec.component" v-bind="componentProps" @close="close" />
        </v-card-text>
        <v-card-actions v-if="showClose">
          <v-spacer />
          <v-btn text @click="close">Close</v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDialogStore } from '@stores/useDialogStore';

const store = useDialogStore();

const spec = computed(() => store.current);
const open = computed({
  get: () => store.open,
  set: (v: boolean) => {
    if (!v) store.closeDialog();
  },
});
const componentProps = computed(() => (store.current?.props ?? {}) as Record<string, unknown>);
const showClose = computed(() => !store.current?.props?.noCloseButton);

function close() {
  store.closeDialog();
}
</script>
