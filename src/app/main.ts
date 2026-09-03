import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import { vuetify } from './providers/vuetify';
import '../styles/widgets.scss';
import { configureAppServices } from './providers/services';
import { ServicesKey } from './providers/injectKeys';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(vuetify);

const pinia = app.config.globalProperties.$pinia as ReturnType<typeof createPinia>;
const services = configureAppServices(pinia);
app.provide(ServicesKey, services);

app.mount('#app');
