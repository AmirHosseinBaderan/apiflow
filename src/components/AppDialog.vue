<template>
  <v-dialog v-model="open" width="700" persistent>
    <template v-if="spec">
      <v-card>
        <v-card-title>
          <div class="d-flex align-center">
            <span>{{ spec.title }}</span>
            <v-spacer />
            <v-btn
              icon="mdi-close"
              size="small"
              variant="text"
              density="comfortable"
              title="Close"
              @click="close"
            />
          </div>
        </v-card-title>
        <v-card-text>
          <component :is="spec.component" v-bind="componentProps" @close="close" />
        </v-card-text>
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

function close() {
  store.closeDialog();
}
</script>
