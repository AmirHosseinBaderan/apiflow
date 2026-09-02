import { defineStore } from 'pinia';
import type { Component } from 'vue';

export interface DialogSpec {
  title?: string;
  component: Component;
  props?: Record<string, unknown>;
}

export const useDialogStore = defineStore('dialog', {
  state: () => ({
    spec: null as DialogSpec | null,
  }),
  getters: {
    open: (state) => state.spec !== null,
    current: (state) => state.spec,
  },
  actions: {
    openDialog(spec: DialogSpec) {
      this.spec = spec;
    },
    closeDialog() {
      this.spec = null;
    },
  },
});
