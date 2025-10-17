import React from 'react';

/**
 * Display: shows current calculation display and any error banner.
 * Accessible with aria-live="polite" to announce changes.
 */
// PUBLIC_INTERFACE
export default function Display({ value, error }) {
  return (
    <div className="display card" aria-live="polite" aria-atomic="true">
      {error ? (
        <div className="error-banner" role="alert" aria-label="Error">
          {error}
        </div>
      ) : null}
      <div className="display-value" data-testid="display-value">
        {value || '0'}
      </div>
      <style>{`
        .display {
          width: 100%;
          box-sizing: border-box;
          padding: 16px;
          margin-bottom: 12px;
          border-radius: 16px;
          text-align: right;
          background: var(--color-surface);
          box-shadow: var(--shadow-sm);
          border: 1px solid rgba(17,24,39,0.06);
        }
        .display-value {
          font-size: 2rem;
          font-weight: 700;
          color: var(--color-text);
          min-height: 2.5rem;
        }
        .error-banner {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: var(--color-error);
          border-radius: 12px;
          padding: 8px 12px;
          margin-bottom: 8px;
          font-size: 0.95rem;
        }
      `}</style>
    </div>
  );
}
