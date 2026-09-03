<template>
  <div>
    <v-list density="compact">
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>{{ t('shortcutNewTab') }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>{{ t('shortcutCloseTab') }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>{{ t('shortcutNextTab') }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>{{ t('shortcutPrevTab') }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>{{ t('shortcutSend') }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>{{ t('shortcutSave') }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>{{ t('shortcutFocusUrl') }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
    <div class="pa-0 mt-2 text-right">
      <v-btn
        rounded="lg"
        @click="close"
      >
        {{ t('cancel') }}
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDialogStore } from '@stores/useDialogStore';
import { useLocaleStore } from '@i18n/store';

const dialog = useDialogStore();
const locale = useLocaleStore();
const t = (key: string) => locale.t(key);

function close() {
  dialog.closeDialog();
}
</script>
