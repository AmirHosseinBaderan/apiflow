<template>
  <v-container
    fluid
    class="bg-grey-darken-4"
  >
    <v-row justify="center">
      <v-col
        cols="12"
        md="8"
        lg="6"
      >
        <v-card class="elevation-4 rounded-lg mt-6">
          <v-card-title class="d-flex align-center">
            <v-icon
              icon="mdi-account-group"
              class="mr-2"
            />
            {{ t('userManagement') }}
            <v-spacer />
            <v-btn
              color="primary"
              variant="elevated"
              prepend-icon="mdi-plus"
              @click="showCreateDialog = true"
            >
              {{ t('addUser') }}
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="store.users"
              :loading="store.loading"
              class="elevation-0"
            >
              <template #item.role="{ item }">
                <v-chip
                  :color="item.role === 'admin' ? 'primary' : 'default'"
                  size="small"
                >
                  {{ item.role }}
                </v-chip>
              </template>
              <template #item.createdAt="{ item }">
                {{ new Date(item.createdAt).toLocaleDateString() }}
              </template>
              <template #item.actions="{ item }">
                <v-icon
                  size="small"
                  class="me-2"
                  @click="openEditDialog(item)"
                >
                  mdi-pencil
                </v-icon>
                <v-icon
                  size="small"
                  @click="confirmDelete(item)"
                >
                  mdi-delete
                </v-icon>
              </template>
            </v-data-table>
            <v-alert
              v-if="store.error"
              type="error"
              class="mt-4"
              density="compact"
            >
              {{ store.error }}
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog
      v-model="showCreateDialog"
      max-width="500"
    >
      <v-card>
        <v-card-title>{{ t('addUser') }}</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handleCreate">
            <v-text-field
              v-model="newUsername"
              :label="t('username')"
              variant="outlined"
              required
              autofocus
            />
            <v-text-field
              v-model="newPassword"
              :label="t('password')"
              variant="outlined"
              type="password"
              required
            />
            <v-select
              v-model="newRole"
              :items="['admin', 'user']"
              :label="t('role')"
              variant="outlined"
              required
            />
            <v-btn
              type="submit"
              color="primary"
              block
              :loading="actionLoading"
              class="mt-4"
            >
              {{ t('save') }}
            </v-btn>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="showEditDialog"
      max-width="500"
    >
      <v-card>
        <v-card-title>{{ t('editUser') }}</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handleEdit">
            <v-text-field
              v-model="editUsername"
              :label="t('username')"
              variant="outlined"
              disabled
            />
            <v-text-field
              v-model="editPassword"
              :label="t('newPassword')"
              variant="outlined"
              type="password"
              hint="Leave blank to keep current password"
              persistent-hint
            />
            <v-select
              v-model="editRole"
              :items="['admin', 'user']"
              :label="t('role')"
              variant="outlined"
              required
            />
            <v-btn
              type="submit"
              color="primary"
              block
              :loading="actionLoading"
              class="mt-4"
            >
              {{ t('save') }}
            </v-btn>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="showDeleteDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title>{{ t('deleteUser') }}</v-card-title>
        <v-card-text>
          {{ t('deleteUserConfirm', editUsername) }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showDeleteDialog = false">
            {{ t('cancel') }}
          </v-btn>
          <v-btn
            color="error"
            :loading="actionLoading"
            @click="handleDelete"
          >
            {{ t('delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useLocaleStore } from '../i18n/store';
import { useAdminStore, type AdminUser } from '../stores/useAdminStore';

const locale = useLocaleStore();
const store = useAdminStore();
const t = (key: string, ...args: unknown[]) => {
  let text = locale.t(key);
  if (args.length > 0 && typeof args[0] === 'string') {
    text = text.replace('{0}', args[0]);
  }
  return text;
};

const headers = [
  { title: 'Username', key: 'username' },
  { title: 'Role', key: 'role' },
  { title: 'Created', key: 'createdAt' },
  { title: 'Actions', key: 'actions', sortable: false },
];

const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const actionLoading = ref(false);

const newUsername = ref('');
const newPassword = ref('');
const newRole = ref('user');

const editUsername = ref('');
const editPassword = ref('');
const editRole = ref('user');

onMounted(() => {
  store.fetchUsers();
});

function openEditDialog(user: AdminUser) {
  editUsername.value = user.username;
  editPassword.value = '';
  editRole.value = user.role;
  showEditDialog.value = true;
}

function confirmDelete(user: AdminUser) {
  editUsername.value = user.username;
  showDeleteDialog.value = true;
}

async function handleCreate() {
  actionLoading.value = true;
  try {
    await store.createUser(newUsername.value, newPassword.value, newRole.value as 'admin' | 'user');
    newUsername.value = '';
    newPassword.value = '';
    newRole.value = 'user';
    showCreateDialog.value = false;
  } finally {
    actionLoading.value = false;
  }
}

async function handleEdit() {
  actionLoading.value = true;
  try {
    const data: Record<string, string> = { role: editRole.value };
    if (editPassword.value) data.password = editPassword.value;
    await store.updateUser(editUsername.value, data);
    showEditDialog.value = false;
  } finally {
    actionLoading.value = false;
  }
}

async function handleDelete() {
  actionLoading.value = true;
  try {
    await store.deleteUser(editUsername.value);
    showDeleteDialog.value = false;
  } finally {
    actionLoading.value = false;
  }
}
</script>
