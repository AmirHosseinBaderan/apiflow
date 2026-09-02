import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import { vuetify } from './providers/vuetify';
import { configureAppServices } from './providers/services';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(vuetify);

const pinia = app.config.globalProperties.$pinia as ReturnType<typeof createPinia>;
configureAppServices(pinia);

app.mount('#app');