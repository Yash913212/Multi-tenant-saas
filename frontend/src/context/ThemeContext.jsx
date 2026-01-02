import React, { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} });

export const ThemeProvider = ({ children }) => {
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
