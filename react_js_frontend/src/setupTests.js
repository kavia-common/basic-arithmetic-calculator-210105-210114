import '@testing-library/jest-dom';

// Provide a localStorage mock if not available (jsdom normally provides it).
if (typeof window !== 'undefined' && !window.localStorage) {
  const store = {};
  window.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
}

// Seed a deterministic deviceId for stable tests
try {
  window.localStorage.setItem('calc.deviceId', '00000000-0000-4000-8000-000000000000');
} catch (e) {
  // ignore
}
