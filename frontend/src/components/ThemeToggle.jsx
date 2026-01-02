import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full border border-vite-border bg-vite-card text-vite-text hover:bg-vite-hover/10 transition-colors"
      aria-label="Toggle theme"
    >
      {isLight ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-blue-200" />}
    </button>
  );
};

export default ThemeToggle;
