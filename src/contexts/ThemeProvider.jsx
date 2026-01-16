
import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations as i18nTranslations } from '@/lib/i18n';
import esTranslations from '@/lib/i18n/es.json';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Load saved preferences or defaults
  const [theme, setTheme] = useState(() => localStorage.getItem('vite-ui-theme') || 'auto');
  const [color, setColor] = useState(() => localStorage.getItem('app-accent-color') || '#3B82F6');
  const [locale, setLocale] = useState(() => localStorage.getItem('app_locale') || 'es');
  
  // Merge translations
  const translations = {
    ...i18nTranslations,
    es: { ...i18nTranslations.es, ...esTranslations }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    
    // 1. Apply Theme Mode
    root.classList.remove('light', 'dark');
    if (theme === 'auto') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(systemDark ? 'dark' : 'light');
    } else {
      root.classList.add(theme);
    }
    
    // 2. Apply Color
    root.style.setProperty('--color-primary', color);
    root.style.setProperty('--color-accent', color); // For backward compatibility
    
    // 3. Persist
    localStorage.setItem('vite-ui-theme', theme);
    localStorage.setItem('app-accent-color', color);
    localStorage.setItem('app_locale', locale);

  }, [theme, color, locale]);

  // Translation function
  const t = (key) => {
    if (!key) return '';
    const keys = key.split('.');
    let value = translations[locale];
    for (const k of keys) {
      if (value && value[k]) { value = value[k]; } 
      else { value = undefined; break; }
    }
    if (value !== undefined) return value;
    // Fallback: convert key to readable text
    const lastKey = keys[keys.length - 1];
    return lastKey.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, color, setColor, locale, setLocale, t }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
