<template>
  <v-app-bar
    app
    elevation="1"
  >
    <v-app-bar-title>
      <v-icon
        icon="mdi-api"
        class="mr-2"
      />
      {{ t('appTitle') }}
    </v-app-bar-title>
    <v-spacer />
    <v-btn
      variant="text"
      to="/"
      prepend-icon="mdi-home"
    >
      {{ t('home') }}
    </v-btn>
  </v-app-bar>

  <v-main>
    <v-container
      fluid
      class="admin-view"
    >
      <v-row>
        <v-col cols="12">
          <v-card
            variant="flat"
            class="admin-card"
            elevation="0"
          >
            <v-card-title class="d-flex align-center pa-6">
              <div>
                <div class="d-flex align-center gap-2">
                  <v-icon
                    icon="mdi-account-group"
                    size="24"
                    color="primary"
                  />
                  <span class="text-h5 font-weight-regular">{{ t('userManagement') }}</span>
                </div>
                <div class="text-subtitle-2 text-medium-emphasis mt-1">
                  {{ t('manageUsersDesc') }}
                </div>
              </div>
              <v-spacer />
              <v-btn
                rounded="lg"
                color="primary"
                variant="elevated"
                prepend-icon="mdi-plus"
                @click="openCreateDialog"
              >
                {{ t('addUser') }}
              </v-btn>
              <v-btn
                rounded="lg"
                variant="tonal"
                prepend-icon="mdi-cog"
                class="ml-2"
                @click="openSettingsDialog"
              >
                {{ t('settings') }}
              </v-btn>
            </v-card-title>

            <v-divider class="mx-6" />

            <v-card-text class="pa-6">
              <v-data-table
                :headers="headers"
                :items="store.users"
                :loading="store.loading"
                :items-per-page="10"
                class="elevation-0"
                density="comfortable"
              >
                <template #item.role="{ item }">
                  <v-chip
                    :color="item.role === 'admin' ? 'primary' : 'surface-variant'"
                    size="small"
                    variant="tonal"
                    rounded="lg"
                  >
                    {{ item.role }}
                  </v-chip>
                </template>
                <template #item.createdAt="{ item }">
                  {{ formatDate(item.createdAt) }}
                </template>
                <template #item.actions="{ item }">
                  <div class="d-flex gap-2">
                    <v-btn
                      color="warning"
                      icon="mdi-pencil"
                      variant="tonal"
                      size="small"
                      rounded="lg"
                      @click="openEditDialog(item)"
                    />
                    <v-btn
                      color="error"
                      icon="mdi-delete"
                      variant="tonal"
                      size="small"
                      rounded="lg"
                      @click="openDeleteDialog(item)"
                    />
                  </div>
                </template>
                <template #no-data>
                  <v-alert
                    type="info"
                    variant="tonal"
                    density="compact"
                    class="ma-4"
                  >
                    {{ t('noUsers') }}
                  </v-alert>
                </template>
              </v-data-table>

              <v-alert
                v-if="store.error"
                type="error"
                variant="tonal"
                class="mt-4"
                density="compact"
              >
                {{ store.error }}
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script setup lang="ts">
  import { onMounted, defineAsyncComponent } from 'vue';
  import { useLocaleStore } from '@i18n/store';
  import { useAdminStore, type AdminUser } from '@stores/useAdminStore';
  import { useDialogStore } from '@stores/useDialogStore';
  import { formatDate } from '@i18n/date';

  const locale = useLocaleStore();
  const store = useAdminStore();
  const dialog = useDialogStore();

  const t = (key: string) => locale.t(key);

  const headers = [
    { title: t('username'), value: 'username' },
    { title: t('role'), value: 'role' },
    { title: t('created'), value: 'createdAt', sortable: true },
    { title: '', value: 'actions', sortable: false },
  ];

  onMounted(async () => {
    await store.fetchUsers();
  });

  function openSettingsDialog() {
    dialog.openDialog({
      component: defineAsyncComponent(() => import('./admin/AdminSettingsDialog.vue')),
      title: t('settings'),
    });
  }

  function openCreateDialog() {
    dialog.openDialog({
      component: defineAsyncComponent(() => import('./admin/UserUpsertDialog.vue')),
      title: t('addUser'),
    });
  }

  function openEditDialog(user: AdminUser) {
    dialog.openDialog({
      component: defineAsyncComponent(() => import('./admin/UserUpsertDialog.vue')),
      title: t('editUser'),
      props: { user },
    });
  }

  function openDeleteDialog(user: AdminUser) {
    dialog.openDialog({
      component: defineAsyncComponent(() => import('./admin/UserDeleteConfirmDialog.vue')),
      title: t('deleteUser'),
      props: { user },
    });
  }
</script>

<style scoped lang="scss">
.admin-card {
  border: 1px solid rgba(var(--v-border-color), 0.12);
  border-radius: 12px;
  background: rgba(var(--v-theme-surface), 0.95);
}

:deep(.v-data-table) {
  border-radius: 8px;
}
</style>
