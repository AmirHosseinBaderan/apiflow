<template>
  <v-container
    fluid
    class="fill-height bg-grey-darken-4"
  >
    <v-row
      justify="center"
      align="center"
    >
      <v-col
        cols="12"
        sm="8"
        md="5"
      >
        <v-card class="elevation-8 rounded-lg">
          <v-card-title class="text-center pt-6">
            <v-icon
              icon="mdi-cog"
              size="48"
              color="primary"
              class="mb-2"
            />
            <h1 class="text-h4 font-weight-bold">
              {{ t('setupTitle') }}
            </h1>
            <p class="text-subtitle-1 text-grey mt-2">
              {{ t('setupSubtitle') }}
            </p>
          </v-card-title>
          <v-card-text class="pt-4">
            <v-form @submit.prevent="handleSetup">
              <v-text-field
                v-model="appName"
                :label="t('appName')"
                variant="outlined"
                required
                autofocus
              />
              <v-select
                v-model="theme"
                :items="themeOptions"
                :label="t('theme')"
                variant="outlined"
                required
              />
              <v-select
                v-model="locale"
                :items="localeOptions"
                :label="t('language')"
                variant="outlined"
                required
              />
              <v-divider class="my-4" />
              <v-switch
                v-model="multiUser"
                :label="t('enableMultiUser')"
                color="primary"
                hide-details
              />
              <template v-if="multiUser">
                <v-text-field
                  v-model="adminUsername"
                  :label="t('adminUsername')"
                  prepend-inner-icon="mdi-account"
                  variant="outlined"
                  required
                  class="mt-4"
                />
                <v-text-field
                  v-model="adminPassword"
                  :label="t('adminPassword')"
                  prepend-inner-icon="mdi-lock"
                  variant="outlined"
                  type="password"
                  required
                  class="mt-2"
                />
                <v-text-field
                  v-model="adminPasswordConfirm"
                  :label="t('confirmPassword')"
                  prepend-inner-icon="mdi-lock-check"
                  variant="outlined"
                  type="password"
                  required
                  class="mt-2"
                />
                <v-alert
                  v-if="passwordMismatch"
                  type="warning"
                  density="compact"
                  class="mt-2"
                >
                  {{ t('passwordMismatch') }}
                </v-alert>
              </template>
              <v-switch
                v-model="forceLogin"
                :label="t('forceLogin')"
                color="primary"
                hide-details
                class="mt-4"
              />
              <v-btn
                type="submit"
                color="primary"
                size="large"
                block
                :loading="loading"
                class="mt-6"
              >
                {{ t('completeSetup') }}
              </v-btn>
              <v-alert
                v-if="error"
                type="error"
                class="mt-4"
                density="compact"
              >
                {{ error }}
              </v-alert>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useLocaleStore } from '../i18n/store';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useAuthStore } from '../stores/useAuthStore';

const router = useRouter();
const locale = useLocaleStore();
const settings = useSettingsStore();
const auth = useAuthStore();
const t = (key: string) => locale.t(key);

const appName = ref('API Flow');
const theme = ref<'light' | 'dark'>('dark');
const localeVal = ref<'en' | 'fa'>('en');
const multiUser = ref(false);
const adminUsername = ref('admin');
const adminPassword = ref('');
const adminPasswordConfirm = ref('');
const forceLogin = ref(true);
const loading = ref(false);
const error = ref('');

const themeOptions = [
  { title: 'Light', value: 'light' },
  { title: 'Dark', value: 'dark' },
];
const localeOptions = [
  { title: 'English', value: 'en' },
  { title: 'Farsi', value: 'fa' },
];

const passwordMismatch = computed(() => {
  return multiUser.value && adminPassword.value !== adminPasswordConfirm.value && adminPasswordConfirm.value !== '';
});

async function handleSetup() {
  if (multiUser.value && passwordMismatch.value) return;
  loading.value = true;
  error.value = '';
  try {
    const body = {
      appName: appName.value,
      defaultTheme: theme.value,
      defaultLocale: localeVal.value,
      multiUser: multiUser.value,
      forceLogin: forceLogin.value,
      ...(multiUser.value ? { username: adminUsername.value, password: adminPassword.value } : {}),
    };
    await auth.setup(body);
    if (theme.value) settings.setTheme(theme.value);
    if (localeVal.value) locale.setLocale(localeVal.value);
    router.push('/');
  } catch (e) {
    const apiError = e as { message?: string };
    error.value = apiError.message || 'Setup failed';
  } finally {
    loading.value = false;
  }
}
</script>
