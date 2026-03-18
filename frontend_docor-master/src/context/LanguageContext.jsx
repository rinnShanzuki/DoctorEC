import React, { createContext, useState, useContext } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('en'); // 'en' or 'fil'

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'fil' : 'en');
    };

    const t = (key, fallback) => {
        // Placeholder for translation logic
        // In a real app, we would look up the key in a translation file based on the current language
        return fallback;
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};
