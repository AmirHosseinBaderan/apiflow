<template>
  <v-container
    fluid
    class="home-view"
  >
    <v-row justify="center">
      <v-col
        cols="12"
        md="10"
        lg="8"
      >
        <div class="text-center mb-8">
          <v-icon
            icon="mdi-api"
            size="48"
            color="primary"
            class="mb-3"
          />
          <h1 class="text-h4 font-weight-regular mb-2">
            {{ t('appTitle') }}
          </h1>
          <p class="text-body-2 text-medium-emphasis">
            {{ t('selectCollection') }}
          </p>
        </div>

        <v-row
          dense
          class="action-cards"
        >
          <v-col
            cols="12"
            sm="6"
          >
            <v-card
              class="action-card"
              hover
              @click="openNew"
            >
              <v-card-text class="d-flex align-center gap-3">
                <v-icon
                  icon="mdi-folder-plus"
                  size="28"
                  color="primary"
                />
                <div>
                  <div class="text-subtitle-1 font-weight-medium">
                    {{ t('newCollection') }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    Create a new workspace
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col
            cols="12"
            sm="6"
          >
            <v-card
              class="action-card"
              hover
              @click="openImport"
            >
              <v-card-text class="d-flex align-center gap-3">
                <v-icon
                  icon="mdi-import"
                  size="28"
                  color="secondary"
                />
                <div>
                  <div class="text-subtitle-1 font-weight-medium">
                    {{ t('import') }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    Import JSON collection
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col
            cols="12"
            sm="6"
          >
            <v-card
              class="action-card"
              hover
              @click="openOpenApi"
            >
              <v-card-text class="d-flex align-center gap-3">
                <v-icon
                  icon="mdi-code-json"
                  size="28"
                  color="info"
                />
                <div>
                  <div class="text-subtitle-1 font-weight-medium">
                    {{ t('importOpenApi') }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    Import from OpenAPI spec
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row
          dense
          class="mt-6"
        >
          <v-col
            cols="12"
            sm="6"
          >
            <v-card
              variant="outlined"
              class="settings-card"
              @click="openSettings"
            >
              <v-card-text class="d-flex align-center justify-space-between pa-4">
                <div class="d-flex align-center gap-3">
                  <v-icon
                    icon="mdi-cog"
                    size="22"
                  />
                  <span class="text-body-1">{{ t('settings') }}</span>
                </div>
                <v-icon
                  icon="mdi-chevron-right"
                  size="20"
                  class="text-medium-emphasis"
                />
              </v-card-text>
            </v-card>
          </v-col>
          <v-col
            cols="12"
            sm="6"
          >
            <v-card
              variant="outlined"
              class="settings-card"
              @click="openShortcuts"
            >
              <v-card-text class="d-flex align-center justify-space-between pa-4">
                <div class="d-flex align-center gap-3">
                  <v-icon
                    icon="mdi-help-circle-outline"
                    size="22"
                  />
                  <span class="text-body-1">{{ t('shortcuts') }}</span>
                </div>
                <v-icon
                  icon="mdi-chevron-right"
                  size="20"
                  class="text-medium-emphasis"
                />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDialogStore } from '@stores/useDialogStore';
import { defineAsyncComponent } from 'vue';
import { useLocaleStore } from '@i18n/store';

const dialog = useDialogStore();
const locale = useLocaleStore();
const t = computed(() => (key: string) => locale.t(key));

function openNew() {
  dialog.openDialog({
    component: defineAsyncComponent(() => import('@modules/workspace/dialogs/NewCollectionDialog.vue')),
    title: t.value('newCollection'),
  });
}

function openImport() {
  dialog.openDialog({
    component: defineAsyncComponent(() => import('@modules/workspace/dialogs/ImportCollectionDialog.vue')),
    title: t.value('import'),
  });
}

function openOpenApi() {
  dialog.openDialog({
    component: defineAsyncComponent(() => import('@modules/workspace/dialogs/OpenApiImportDialog.vue')),
    title: t.value('importOpenApi'),
  });
}

function openSettings() {
  dialog.openDialog({
    component: defineAsyncComponent(() => import('@modules/workspace/dialogs/SettingsDialog.vue')),
    title: t.value('settings'),
  });
}

function openShortcuts() {
  dialog.openDialog({
    component: defineAsyncComponent(() => import('@modules/workspace/dialogs/ShortcutsDialog.vue')),
    title: t.value('shortcuts'),
  });
}
</script>

<style scoped lang="scss">
.home-view {
  max-width: 960px;
  margin: 0 auto;
}

.action-card {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
}

.settings-card {
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: rgba(var(--v-theme-surface-variant), 0.04);
  }
}
</style>
