<template>
  <v-menu offset-y>
    <template v-slot:activator="{ props: menuProps }">
      <v-btn
        v-bind="menuProps"
        icon="mdi-variable"
        size="small"
        variant="text"
        density="compact"
        :title="t('insertVariable')"
      />
    </template>
    <v-list density="compact" style="max-width: 220px">
      <v-list-item
        v-for="v in variables"
        :key="v.name"
        :title="v.description"
        @click="emit('pick', v.name)"
      >
        <v-list-item-content>
          <v-list-item-title>{{ `{{${v.name}}` }}</v-list-item-content>
        </v-list-item-content>
      </v-list-item>
      <v-list-item v-if="!variables.length" :title="t('noVariables')">
        <v-list-item-content>
          <v-list-item-title class="text-medium-emphasis">{{ t('noVariables') }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import { useLocaleStore } from '@i18n/store';

export interface VariableDef {
  name: string;
  description?: string;
}

const props = defineProps<{ variables: VariableDef[] }>();
const emit = defineEmits<{ (e: 'pick', name: string): void }>();

const locale = useLocaleStore();
const t = (key: string) => locale.t(key);
</script>
