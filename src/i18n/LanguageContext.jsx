import React, { createContext, useContext, useState } from 'react';
import translations from './translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en'); // Default: English

  const t = (key) => translations[lang]?.[key] ?? translations['en']?.[key] ?? key;

  const toggleLanguage = () => setLang(prev => prev === 'en' ? 'bn' : 'en');

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}
