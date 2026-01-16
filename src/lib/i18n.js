
import es from './i18n/es.json';
import en from './i18n/en.json';
import pt from './i18n/pt.json';

export const translations = {
  es,
  en,
  pt
};

const getNestedValue = (obj, path) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export const t = (key) => {
  if (!key) return '';
  
  // Get language from localStorage or default to 'es'
  // This allows the function to work even outside of React components
  const currentLang = localStorage.getItem('app-language') || 'es';
  const langData = translations[currentLang] || translations.es;
  
  const value = getNestedValue(langData, key);
  
  // Return translation or key if missing
  return value || key;
};
