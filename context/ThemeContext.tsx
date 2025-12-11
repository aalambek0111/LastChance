import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
export type Language = 'en' | 'ru';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    nav_dashboard: 'Dashboard',
    nav_inbox: 'Inbox',
    nav_leads: 'Leads',
    nav_bookings: 'Bookings',
    nav_tours: 'Tours',
    nav_reports: 'Reports',
    nav_team: 'Team',
    nav_settings: 'Settings',
    page_dashboard_title: 'Dashboard',
    page_inbox_title: 'Inbox',
    page_leads_title: 'Leads',
    page_bookings_title: 'Bookings',
    page_tours_title: 'Tours',
    page_reports_title: 'Reports',
    page_team_title: 'Team',
    page_settings_title: 'Settings',
    leads_status_new: 'New',
    leads_status_contacted: 'Contacted',
    leads_status_qualified: 'Qualified',
    leads_status_booked: 'Booked',
    leads_status_lost: 'Lost',
  },
  ru: {
    nav_dashboard: 'Дашборд',
    nav_inbox: 'Входящие',
    nav_leads: 'Лиды',
    nav_bookings: 'Бронирования',
    nav_tours: 'Туры',
    nav_reports: 'Отчеты',
    nav_team: 'Команда',
    nav_settings: 'Настройки',
    page_dashboard_title: 'Дашборд',
    page_inbox_title: 'Входящие',
    page_leads_title: 'Лиды',
    page_bookings_title: 'Бронирования',
    page_tours_title: 'Туры',
    page_reports_title: 'Отчеты',
    page_team_title: 'Команда',
    page_settings_title: 'Настройки',
    leads_status_new: 'Новый',
    leads_status_contacted: 'Связались',
    leads_status_qualified: 'Квалифицирован',
    leads_status_booked: 'Забронирован',
    leads_status_lost: 'Потерян',
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme Logic
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as Theme;
      if (saved) return saved;
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    }
    return 'light';
  });

  // Language Logic
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('language') as Language;
      if (saved === 'en' || saved === 'ru') return saved;
    }
    return 'en';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('language', language);
    // Optional: Update HTML lang attribute
    document.documentElement.lang = language;
  }, [language]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const t = (key: string) => {
    const langData = translations[language] || translations['en'];
    return langData[key] || translations['en'][key] || key;
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, language, setLanguage, t }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Export useI18n as the primary hook for translations
export const useI18n = useTheme;
