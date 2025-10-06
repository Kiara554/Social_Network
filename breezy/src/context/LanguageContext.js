import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('fr');
  const [texts, setTexts] = useState(translations.fr);

  useEffect(() => {
    // Charger la langue depuis localStorage au chargement
    const savedLanguage = localStorage.getItem('language') || 'fr';
    setLanguage(savedLanguage);
    setTexts(translations[savedLanguage]);
  }, []);

  const changeLanguage = (newLanguage) => {
    if (translations[newLanguage]) {
      setLanguage(newLanguage);
      setTexts(translations[newLanguage]);
      localStorage.setItem('language', newLanguage);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, texts, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
