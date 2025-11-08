
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/i18n';

interface LocalizationContextType {
  locale: string;
  setLocale: (locale: string) => Promise<void>;
  t: (key: string, params?: Record<string, any>) => string;
  availableLocales: { code: string; name: string; flag: string }[];
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

const STORAGE_KEY = '@maxcoin_locale';

const AVAILABLE_LOCALES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
];

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<string>('en');

  useEffect(() => {
    loadLocale();
  }, []);

  const loadLocale = async () => {
    try {
      // Try to load saved locale
      const savedLocale = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (savedLocale) {
        i18n.locale = savedLocale;
        setLocaleState(savedLocale);
        console.log('Loaded saved locale:', savedLocale);
      } else {
        // Use device locale
        const deviceLocales = getLocales();
        const deviceLocale = deviceLocales[0];
        const languageCode = deviceLocale.languageCode || 'en';
        
        // Check if we support this language
        const supportedLocale = AVAILABLE_LOCALES.find(l => l.code === languageCode);
        const finalLocale = supportedLocale ? languageCode : 'en';
        
        i18n.locale = finalLocale;
        setLocaleState(finalLocale);
        await AsyncStorage.setItem(STORAGE_KEY, finalLocale);
        
        console.log('Device locale:', deviceLocale);
        console.log('Using locale:', finalLocale);
      }
    } catch (error) {
      console.error('Error loading locale:', error);
      i18n.locale = 'en';
      setLocaleState('en');
    }
  };

  const setLocale = async (newLocale: string) => {
    try {
      i18n.locale = newLocale;
      setLocaleState(newLocale);
      await AsyncStorage.setItem(STORAGE_KEY, newLocale);
      console.log('Locale changed to:', newLocale);
    } catch (error) {
      console.error('Error saving locale:', error);
    }
  };

  const t = (key: string, params?: Record<string, any>) => {
    return i18n.t(key, params);
  };

  return (
    <LocalizationContext.Provider
      value={{
        locale,
        setLocale,
        t,
        availableLocales: AVAILABLE_LOCALES,
      }}
    >
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within LocalizationProvider');
  }
  return context;
}
