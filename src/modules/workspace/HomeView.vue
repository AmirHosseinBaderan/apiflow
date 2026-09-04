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
        <div class="text-center mb-6">
          <v-icon
            icon="mdi-api"
            size="48"
            color="primary"
            class="mb-3"
          />
          <h1 class="text-h4 font-weight-regular mb-2">
            {{ t('appTitle') }}
          </h1>
        </div>

        <v-card
          v-if="auth.isAuthenticated && auth.user"
          class="action-card profile-card mb-6"
          hover
        >
          <v-card-text class="d-flex align-center justify-space-between pa-4">
            <div class="d-flex align-center gap-3">
              <v-avatar
                color="primary"
                size="40"
              >
                <v-icon icon="mdi-account" />
              </v-avatar>
              <div>
                <div class="text-subtitle-1 font-weight-medium">
                  {{ auth.user.username }}
                </div>
                <v-chip
                  size="x-small"
                  :color="auth.isAdmin ? 'primary' : 'default'"
                  variant="tonal"
                >
                  {{ auth.isAdmin ? t('admin') : t('user') }}
                </v-chip>
              </div>
            </div>
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="tonal"
              @click="openEditProfile"
            />
          </v-card-text>
        </v-card>

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
                    {{ t('createNewWorkspace') }}
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
                    {{ t('importJsonCollection') }}
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col
            cols="12"
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
                    {{ t('importFromOpenApi') }}
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
              @click="openConfiguration"
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useDialogStore } from '@stores/useDialogStore';
import { defineAsyncComponent } from 'vue';
import { useLocaleStore } from '@i18n/store';
import { useAuthStore } from '@stores/useAuthStore';
import { useNotifier } from '@composables/useNotifier';
import {updateProfile} from "../../api/calls/auth";

const router = useRouter();
const dialog = useDialogStore();
const locale = useLocaleStore();
const auth = useAuthStore();
const { notify } = useNotifier();
const t = (key: string) => locale.t(key);

const profileForm = ref({
  username: auth.user?.username ?? '',
  password: '',
  currentPassword: '',
});
const savingProfile = ref(false);

function openNew() {
  dialog.openDialog({
    component: defineAsyncComponent(() => import('@modules/workspace/dialogs/NewCollectionDialog.vue')),
    title: t('newCollection'),
  });
}

function openImport() {
  dialog.openDialog({
    component: defineAsyncComponent(() => import('@modules/workspace/dialogs/ImportCollectionDialog.vue')),
    title: t('import'),
  });
}

function openOpenApi() {
  dialog.openDialog({
    component: defineAsyncComponent(() => import('@modules/workspace/dialogs/OpenApiImportDialog.vue')),
    title: t('importOpenApi'),
  });
}

function openShortcuts() {
  dialog.openDialog({
    component: defineAsyncComponent(() => import('@modules/workspace/dialogs/ShortcutsDialog.vue')),
    title: t('shortcuts'),
  });
}

function openConfiguration() {
  if (!auth.isAuthenticated) {
    router.push({ name: 'login' });
    return;
  }
  dialog.openDialog({
    component: defineAsyncComponent(() => import('@modules/workspace/dialogs/SettingsDialog.vue')),
    title: t('settings'),
  });
}

function openEditProfile() {
  profileForm.value = {
    username: auth.user?.username ?? '',
    password: '',
    currentPassword: '',
  };
  dialog.openDialog({
    component: defineAsyncComponent(() => import('./dialogs/ProfileEditDialog.vue')),
    title: t('editProfile'),
    props: {
      form: profileForm.value,
      saving: savingProfile,
      onSave: saveProfile,
    },
  });
}

async function saveProfile() {
  if (!auth.user) return;
  savingProfile.value = true;
  try {
    const updated = await updateProfile({
      username: profileForm.value.username !== auth.user.username ? profileForm.value.username : undefined,
      password: profileForm.value.password || undefined,
      currentPassword: profileForm.value.currentPassword || undefined,
    });
    auth.setAuth(auth.token!, updated);
    notify(t('profileUpdated'), 'success');
    dialog.closeDialog();
  } catch (e) {
    notify(t('profileUpdateFailed'), 'error');
  } finally {
    savingProfile.value = false;
  }
}
</script>

<style scoped lang="scss">
.profile-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

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