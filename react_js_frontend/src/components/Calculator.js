import React, { useCallback, useMemo, useState } from 'react';
import Display from './Display';
import Keypad from './Keypad';
import { useAuth } from '../lib/auth';
import { auditDigit, auditOperator, auditCompute, auditClear, auditError } from '../lib/audit';
import { validateDigit, validateOperator, canAppendDecimal, enforceMaxLength, canCompute } from '../lib/validation';
import { safeTry, toUserMessage } from '../lib/errorHandling';

//
// ============================================================================
// REQUIREMENT TRACEABILITY
// ============================================================================
// Requirement ID: REQ-CALC-005
// User Story: As a user, I can calculate basic arithmetic with validations, audit, and e-sign for critical ops.
// Acceptance Criteria: All operations, decimals, chaining, backspace, divide-by-zero guard, e-sign for '=' and 'C'.
// GxP Impact: YES - includes audit trail, validation, and e-signature.
// Risk Level: MEDIUM
// Validation Protocol: VP-CALC-001
// ============================================================================

/**
 * Pure calculation helper using scaled integers to minimize float error.
 * PUBLIC_INTERFACE
 */
export function calculate(aStr, op, bStr) {
  /** Performs arithmetic with safe float handling. Throws on invalid op or divide-by-zero. */
  const a = Number(aStr);
  const b = Number(bStr);
  if (Number.isNaN(a) || Number.isNaN(b)) throw new Error('Invalid number');
  if (!validateOperator(op)) throw new Error('Invalid operator');

  // Determine scaling factor by decimal length
  const decLen = (n) => {
    const s = String(n);
    const idx = s.indexOf('.');
    return idx === -1 ? 0 : s.length - idx - 1;
  };
  const scalePow = Math.max(decLen(aStr), decLen(bStr));
  const scale = 10 ** scalePow;

  const A = Math.round(a * scale);
  const B = Math.round(b * scale);

  let result;
  switch (op) {
    case '+':
      result = (A + B) / scale;
      break;
    case '-':
      result = (A - B) / scale;
      break;
    case '*':
      // multiply requires double scaling
      result = (A * B) / (scale * scale);
      break;
    case '/':
      if (b === 0) throw new Error('Divide by zero');
      result = a / b;
      break;
    default:
      throw new Error('Unknown operator');
  }

  // Format to at most 10 decimals, trim trailing zeros
  const asStr = String(result.toFixed(10)).replace(/\.?0+$/, '');
  return asStr;
}

function EsignModal({ open, onConfirm, onCancel }) {
  const { user } = useAuth();
  const [pin, setPin] = useState('');
  const handleConfirm = () => onConfirm(pin);
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="Electronic Signature Confirmation" className="esign-overlay">
      <div className="esign-card card">
        <h3>Electronic Signature</h3>
        <p>Please confirm your identity to proceed.</p>
        <div className="field">
          <label htmlFor="pin">PIN</label>
          <input
            id="pin"
            name="pin"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN"
            aria-label="PIN"
          />
        </div>
        <div className="actions">
          <button className="btn" onClick={handleConfirm} aria-label="Confirm signature">
            Confirm
          </button>
          <button className="btn" onClick={onCancel} aria-label="Cancel signature" style={{ background: '#6b7280' }}>
            Cancel
          </button>
        </div>
        <div className="meta">
          <span>User: {user?.name} ({user?.id})</span>
        </div>
      </div>
      <style>{`
        .esign-overlay {
          position: fixed; inset: 0; background: rgba(17,24,39,0.4);
          display: flex; align-items: center; justify-content: center; padding: 16px;
        }
        .esign-card {
          width: 100%; max-width: 360px; padding: 16px; text-align: left;
        }
        .field { margin: 12px 0; display: flex; flex-direction: column; gap: 6px; }
        input {
          border-radius: 10px; border: 1px solid rgba(17,24,39,0.12);
          padding: 10px 12px; background: var(--color-surface); color: var(--color-text);
        }
        input:focus-visible { outline: none; box-shadow: var(--focus-ring); }
        .actions { display: flex; gap: 8px; margin-top: 8px; }
        .meta { margin-top: 8px; font-size: 12px; opacity: 0.8; }
      `}</style>
    </div>
  );
}

// PUBLIC_INTERFACE
export default function Calculator() {
  const { user } = useAuth();
  const [state, setState] = useState({ inputA: '', inputB: '', operator: null });
  const [display, setDisplay] = useState('0');
  const [error, setError] = useState('');
  const [pendingAction, setPendingAction] = useState(null); // 'compute' or 'clear'
  const [modalOpen, setModalOpen] = useState(false);

  const beforeSnapshot = useMemo(
    () => ({ inputA: state.inputA, inputB: state.inputB, operator: state.operator, display, error }),
    [state, display, error]
  );

  const resetAll = useCallback(() => {
    setState({ inputA: '', inputB: '', operator: null });
    setDisplay('0');
    setError('');
  }, []);

  const appendDigit = useCallback((d) => {
    if (!validateDigit(d)) return;
    if (error) setError('');
    setState((prev) => {
      const targetKey = prev.operator ? 'inputB' : 'inputA';
      const curr = String(prev[targetKey] || '');
      const next = enforceMaxLength(curr === '0' ? d : curr + d);
      const newState = { ...prev, [targetKey]: next };
      setDisplay(newState.operator ? newState.inputB || newState.inputA || '0' : newState.inputA || '0');
      auditDigit({ userId: user.id, beforeState: beforeSnapshot, afterState: newState, reason: 'digit' });
      return newState;
    });
  }, [user?.id, error, beforeSnapshot]);

  const appendDecimal = useCallback(() => {
    setState((prev) => {
      const nextState = { ...prev };
      const targetKey = prev.operator ? 'inputB' : 'inputA';
      if (!canAppendDecimal(prev)) return prev;
      const curr = String(prev[targetKey] || '');
      nextState[targetKey] = curr === '' ? '0.' : curr + '.';
      setDisplay(nextState.operator ? nextState.inputB || nextState.inputA || '0' : nextState.inputA || '0');
      auditDigit({ userId: user.id, beforeState: beforeSnapshot, afterState: nextState, reason: 'decimal' });
      return nextState;
    });
  }, [user?.id, beforeSnapshot]);

  const chooseOperator = useCallback((op) => {
    if (!validateOperator(op)) return;
    if (error) setError('');
    setState((prev) => {
      // chaining: if we already have a,b,op and b exists, compute first then set new operator
      if (prev.operator && prev.inputB !== '') {
        // compute intermediate result
        try {
          const result = calculate(prev.inputA, prev.operator, prev.inputB);
          const chained = { inputA: result, inputB: '', operator: op };
          setDisplay(result);
          auditOperator({ userId: user.id, beforeState: beforeSnapshot, afterState: chained });
          return chained;
        } catch (e) {
          const msg = toUserMessage(e?.message || e);
          setError(msg);
          auditError({ userId: user.id, beforeState: beforeSnapshot, afterState: prev, error: String(e) });
          return prev;
        }
      }
      const next = { ...prev, operator: op };
      auditOperator({ userId: user.id, beforeState: beforeSnapshot, afterState: next });
      return next;
    });
  }, [user?.id, error, beforeSnapshot]);

  const doBackspace = useCallback(() => {
    setState((prev) => {
      const targetKey = prev.operator ? 'inputB' : 'inputA';
      const curr = String(prev[targetKey] || '');
      if (!curr) return prev;
      const nextVal = curr.slice(0, -1);
      const nextState = { ...prev, [targetKey]: nextVal };
      setDisplay(nextState.operator ? (nextState.inputB || nextState.inputA || '0') : (nextState.inputA || '0'));
      auditDigit({ userId: user.id, beforeState: beforeSnapshot, afterState: nextState, reason: 'backspace' });
      return nextState;
    });
  }, [user?.id, beforeSnapshot]);

  const requestEsign = useCallback((type) => {
    setPendingAction(type);
    setModalOpen(true);
  }, []);

  const handleEsignConfirm = useCallback((pin) => {
    setModalOpen(false);
    const signature = { verified: pin === user.pin, method: 'pin' };
    if (!signature.verified) {
      const msg = 'Invalid PIN';
      setError(msg);
      auditError({ userId: user.id, beforeState: beforeSnapshot, afterState: null, error: msg });
      setPendingAction(null);
      return;
    }
    if (pendingAction === 'compute') {
      if (!canCompute(state)) return;
      safeTry(
        () => {
          const result = calculate(state.inputA, state.operator, state.inputB);
          const afterState = { inputA: result, inputB: '', operator: null };
          setState(afterState);
          setDisplay(result);
          auditCompute({ userId: user.id, beforeState: beforeSnapshot, afterState, signature });
        },
        (e) => setError(toUserMessage(e?.message || e)),
        { userId: user.id, beforeState: beforeSnapshot }
      );
    } else if (pendingAction === 'clear') {
      const afterState = { inputA: '', inputB: '', operator: null };
      auditClear({ userId: user.id, beforeState: beforeSnapshot, afterState, signature });
      resetAll();
    }
    setPendingAction(null);
  }, [pendingAction, user?.pin, user?.id, state, beforeSnapshot, resetAll]);

  const handleEsignCancel = useCallback(() => {
    setModalOpen(false);
    setPendingAction(null);
  }, []);

  // PUBLIC_INTERFACE
  const onKeyPress = useCallback((token) => {
    switch (token) {
      case '0': case '1': case '2': case '3': case '4':
      case '5': case '6': case '7': case '8': case '9':
        return appendDigit(token);
      case '.':
        return appendDecimal();
      case '+': case '-': case '*': case '/':
        return chooseOperator(token);
      case 'BS':
        return doBackspace();
      case 'C':
        return requestEsign('clear');
      case '=':
        return requestEsign('compute');
      default:
        return null;
    }
  }, [appendDigit, appendDecimal, chooseOperator, doBackspace, requestEsign]);

  return (
    <div className="calculator-wrap">
      <div className="calculator card" role="region" aria-label="Calculator">
        <h2 className="title">Ocean Calculator</h2>
        <Display value={display} error={error} />
        <Keypad onKeyPress={onKeyPress} />
      </div>
      <EsignModal open={modalOpen} onConfirm={handleEsignConfirm} onCancel={handleEsignCancel} />
      <style>{`
        .calculator-wrap {
          display: flex; align-items: center; justify-content: center;
          width: 100%; padding: 16px;
        }
        .calculator {
          padding: 16px;
          background: var(--color-surface);
          width: 320px;
          border-radius: 18px;
          box-shadow: var(--shadow-lg);
          border: 1px solid rgba(17,24,39,0.06);
        }
        .title {
          margin: 4px 0 10px; font-size: 1.1rem; color: var(--color-text);
        }
      `}</style>
    </div>
  );
}
