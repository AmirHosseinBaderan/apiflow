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
        md="4"
      >
        <v-card class="elevation-8 rounded-lg">
          <v-card-title class="text-center pt-6">
            <v-icon
              icon="mdi-api"
              size="48"
              color="primary"
              class="mb-2"
            />
            <h1 class="text-h4 font-weight-bold">
              {{ appName }}
            </h1>
            <p class="text-subtitle-1 text-grey mt-2">
              {{ t('loginTitle') }}
            </p>
          </v-card-title>
          <v-card-text class="pt-4">
            <v-form @submit.prevent="handleLogin">
              <v-text-field
                v-model="username"
                :label="t('username')"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                required
                autofocus
              />
              <v-text-field
                v-model="password"
                :label="t('password')"
                prepend-inner-icon="mdi-lock"
                variant="outlined"
                type="password"
                required
              />
              <v-btn
                type="submit"
                color="primary"
                size="large"
                block
                :loading="loading"
                class="mt-4"
              >
                {{ t('login') }}
              </v-btn>
            </v-form>
            <v-alert
              v-if="error"
              type="error"
              class="mt-4"
              density="compact"
            >
              {{ error }}
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useLocaleStore } from '../i18n/store';
import { authLogin } from '@/api/calls/auth';
import { useAuthStore } from '../stores/useAuthStore';

const router = useRouter();
const locale = useLocaleStore();
const auth = useAuthStore();
const t = (key: string) => locale.t(key);

const username = ref('');
const password = ref('');
const appName = ref('API Flow');
const loading = ref(false);
const error = ref('');

async function handleLogin() {
  loading.value = true;
  error.value = '';
  try {
    const data = await authLogin({ username: username.value, password: password.value });
    auth.setAuth(data.token, data.user);
    router.push('/');
  } catch (e: unknown) {
    const apiError = e as { message?: string };
    error.value = apiError.message || 'Login failed';
  } finally {
    loading.value = false;
  }
}
</script>
