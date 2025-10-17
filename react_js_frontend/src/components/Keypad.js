import React, { useEffect } from 'react';

// PUBLIC_INTERFACE
export default function Keypad({ onKeyPress }) {
  /**
   * Renders calculator keypad buttons and maps keyboard events to tokens.
   * Emits tokens: '0'-'9','+','-','*','/','.','=','C','BS'
   */
  useEffect(() => {
    const handler = (e) => {
      const { key } = e;
      if (/^[0-9]$/.test(key)) return onKeyPress(key);
      if (key === '+' || key === '-' || key === '*' || key === '/') return onKeyPress(key);
      if (key === 'Enter' || key === '=') return onKeyPress('=');
      if (key === '.') return onKeyPress('.');
      if (key === 'Backspace') return onKeyPress('BS');
      if (key.toLowerCase() === 'c' || key === 'Escape') return onKeyPress('C');
      return null;
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onKeyPress]);

  const Button = ({ label, token, aria }) => (
    <button
      type="button"
      className={`key ${token === '=' ? 'equals' : ''}`}
      aria-label={aria || label}
      onClick={() => onKeyPress(token)}
    >
      {label}
    </button>
  );

  return (
    <div className="keypad">
      <div className="grid">
        <Button label="C" token="C" aria="Clear" />
        <Button label="⌫" token="BS" aria="Backspace" />
        <Button label="÷" token="/" aria="Divide" />
        <Button label="×" token="*" aria="Multiply" />

        <Button label="7" token="7" />
        <Button label="8" token="8" />
        <Button label="9" token="9" />
        <Button label="−" token="-" aria="Subtract" />

        <Button label="4" token="4" />
        <Button label="5" token="5" />
        <Button label="6" token="6" />
        <Button label="+" token="+" aria="Add" />

        <Button label="1" token="1" />
        <Button label="2" token="2" />
        <Button label="3" token="3" />
        <Button label="=" token="=" aria="Equals" />

        <Button label="0" token="0" />
        <Button label="." token="." aria="Decimal point" />
      </div>
      <style>{`
        .keypad .grid {
          display: grid;
          grid-template-columns: repeat(4, 70px);
          grid-auto-rows: 56px;
          gap: 10px;
          justify-content: center;
        }
        .key {
          background: var(--color-surface);
          border: 1px solid rgba(17,24,39,0.06);
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--color-text);
          box-shadow: var(--shadow-sm);
          cursor: pointer;
          transition: transform 0.06s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .key:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }
        .key:focus-visible {
          outline: none;
          box-shadow: var(--focus-ring);
        }
        .equals {
          background: var(--color-primary);
          color: white;
          border: 1px solid rgba(37,99,235,0.6);
        }
        /* Make last row items span appropriately: 0 and . side by side */
        .grid > :nth-last-child(2) {
          grid-column: span 2;
        }
      `}</style>
    </div>
  );
}
