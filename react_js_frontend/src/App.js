import React, { useState, useEffect } from 'react';
import './App.css';
import './styles/theme.css';
import Calculator from './components/Calculator';

// PUBLIC_INTERFACE
function App() {
  /**
   * Main application entry component. Manages a user-toggleable light/dark mode
   * and renders the Calculator UI.
   */
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="App gradient-bg">
      <header className="App-header">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <main>
          <Calculator />
        </main>
      </header>
    </div>
  );
}

export default App;
