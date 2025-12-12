// src/context/ThemeContext.js
import React, { createContext, useContext, useEffect } from 'react';
import { themePresets } from './themePresets';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const theme = themePresets.default;

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme.values).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
