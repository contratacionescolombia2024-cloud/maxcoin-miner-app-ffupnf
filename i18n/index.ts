
import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import en from './translations/en';
import es from './translations/es';
import pt from './translations/pt';

// Create i18n instance
const i18n = new I18n({
  en,
  es,
  pt,
});

// Get device locale
const deviceLocale = getLocales()[0];
console.log('Device locale detected:', deviceLocale.languageCode);

// Set the locale based on device settings
i18n.locale = deviceLocale.languageCode || 'en';

// Enable fallback to English if translation is missing
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export default i18n;
