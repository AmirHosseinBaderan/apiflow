import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import {createVuetify} from 'vuetify';
import {VTreeview} from 'vuetify/labs/VTreeview';

export const vuetify = createVuetify({
    components: {VTreeview},
    defaults: {
        VTextField: {variant: 'outlined', density: 'comfortable', hideDetails: 'auto', rounded: 'lg'},
        VSelect: {variant: 'outlined', density: 'comfortable', hideDetails: 'auto', rounded: 'lg'},
        VTextarea: {variant: 'outlined', density: 'comfortable', hideDetails: 'auto', rounded: 'lg'},
        VCard: {variant: 'elevated', rounded: 'lg'},
    },
    theme: {
        defaultTheme: 'dark',
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
