import i18n from 'sveltekit-i18n';
import translations from './translations';

/** @type {import('sveltekit-i18n').Config} */
const config = {
    initLocale: 'fr',
    translations,
};

export const { t, l, locales, locale } = new i18n(config);