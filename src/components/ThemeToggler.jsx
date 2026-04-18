import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const ThemeToggler = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      onClick={toggleTheme}
      style={{
        background: 'var(--bg-panel-muted)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        padding: '8px',
        color: 'var(--text-main)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
      }}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

export default ThemeToggler;
