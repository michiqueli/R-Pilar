import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations as i18nTranslations } from '@/lib/i18n';
import esTranslations from '@/lib/i18n/es.json';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // 1. Cargamos los valores iniciales. 
  // IMPORTANTE: Aseguramos que el estado inicial sea consistente.
  const [theme, setTheme] = useState(() => {
    // Intentar leer de localStorage inmediatamente
    const saved = localStorage.getItem('vite-ui-theme');
    if (saved) return saved;
    
    // Si no hay nada, verificar sistema
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });
  const [color, setColor] = useState(() => localStorage.getItem('app-accent-color') || '#3B82F6');
  const [locale, setLocale] = useState(() => localStorage.getItem('app_locale') || 'es');
  

  
  const translations = {
    ...i18nTranslations,
    es: { ...i18nTranslations.es, ...esTranslations }
  };

  // Efecto separado para el tema: esto evita parpadeos y asegura que se aplique la clase al root
  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = (currentTheme) => {
      root.classList.remove('light', 'dark');
      
      if (currentTheme === 'auto') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.add(systemDark ? 'dark' : 'light');
      } else {
        root.classList.add(currentTheme);
      }
    };

    applyTheme(theme);
    localStorage.setItem('vite-ui-theme', theme);

    // Escuchar cambios de preferencia del sistema si está en 'auto'
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('auto');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Efecto para otros valores persistentes
  useEffect(() => {
    const root = window.document.documentElement;
    root.style.setProperty('--color-primary', color);
    root.style.setProperty('--color-accent', color);
    
    localStorage.setItem('app-accent-color', color);
    localStorage.setItem('app_locale', locale);
  }, [color, locale]);

  const t = (key) => {
    if (!key) return '';
    const keys = key.split('.');
    let value = translations[locale];
    for (const k of keys) {
      if (value && value[k]) { value = value[k]; } 
      else { value = undefined; break; }
    }
    if (value !== undefined) return value;
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