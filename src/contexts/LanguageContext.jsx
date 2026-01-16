
import React from 'react';
import { useTheme } from '@/contexts/ThemeProvider';

// This context is maintained for backward compatibility.
// It bridges calls to the new ThemeProvider which now handles localization.

export const LanguageContext = React.createContext();

export const LanguageProvider = ({ children }) => {
  // No-op provider: State is now managed by ThemeProvider in App.jsx
  return <>{children}</>;
};

export const useTranslation = () => {
  // Redirect to the new source of truth (ThemeProvider)
  // This prevents crashes in components that haven't been migrated to useTheme yet
  const { t, locale, setLocale, mode, setMode, theme, setTheme } = useTheme();
  
  return {
    t,
    language: locale,
    setLanguage: setLocale,
    mode,
    setMode,
    currentTheme: theme,
    setCurrentTheme: setTheme,
    availableThemes: {} // Legacy support
  };
};
