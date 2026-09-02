import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import { createVuetify } from 'vuetify';
import { VTreeview } from 'vuetify/labs/VTreeview';

export const vuetify = createVuetify({
  components: { VTreeview },
  defaults: {
    VBtn: { variant: 'flat', density: 'comfortable' },
    VTextField: { variant: 'outlined', density: 'comfortable', hideDetails: 'auto' },
    VSelect: { variant: 'outlined', density: 'comfortable', hideDetails: 'auto' },
    VTextarea: { variant: 'outlined', density: 'comfortable', hideDetails: 'auto' },
    VCard: { variant: 'elevated' },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#1867C0',
          secondary: '#5CBBF6',
          surface: '#FFFFFF',
          background: '#F4F5F8',
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: '#5CBBF6',
          secondary: '#1867C0',
        },
      },
    },
  },
});