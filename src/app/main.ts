import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import { vuetify } from './providers/vuetify';
import '../styles/widgets.scss';
import { configureAppServices } from './providers/services';
import { ServicesKey } from './providers/injectKeys';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(vuetify);

configureAppServices(pinia).then((services) => {
  app.provide(ServicesKey, services);
  app.mount('#app');
});
