import React, { useState, useEffect } from 'react';
import './App.css';
import './styles/theme.css';
import { AuthProvider } from './lib/auth';
import Calculator from './components/Calculator';

// PUBLIC_INTERFACE
function App() {
  /**
   * This is the main application entry component that composes the AuthProvider
   * with the Calculator UI and manages a user-toggleable light/dark mode.
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
        <AuthProvider>
          <main>
            <Calculator />
          </main>
        </AuthProvider>
      </header>
    </div>
  );
}

export default App;
