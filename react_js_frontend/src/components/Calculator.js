import React, { useCallback, useMemo, useState } from 'react';
import Display from './Display';
import Keypad from './Keypad';
import { auditDigit, auditOperator, auditCompute, auditClear, auditError } from '../lib/audit';
import { validateDigit, validateOperator, canAppendDecimal, enforceMaxLength, canCompute } from '../lib/validation';
import { safeTry, toUserMessage } from '../lib/errorHandling';

//
// ============================================================================
// REQUIREMENT TRACEABILITY
// ============================================================================
// Requirement ID: REQ-CALC-005 (Updated)
// User Story: As a user, I can calculate basic arithmetic with validations and audit,
//             without authentication or e-signature prompts.
// Acceptance Criteria: All operations, decimals, chaining, backspace, divide-by-zero guard.
// GxP Impact: YES - includes audit trail and validation.
// Risk Level: MEDIUM
// Validation Protocol: VP-CALC-ANON-001
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

// PUBLIC_INTERFACE
export default function Calculator() {
  const [state, setState] = useState({ inputA: '', inputB: '', operator: null });
  const [display, setDisplay] = useState('0');
  const [error, setError] = useState('');

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
      auditDigit({ beforeState: beforeSnapshot, afterState: newState, reason: 'digit' });
      return newState;
    });
  }, [error, beforeSnapshot]);

  const appendDecimal = useCallback(() => {
    setState((prev) => {
      const nextState = { ...prev };
      const targetKey = prev.operator ? 'inputB' : 'inputA';
      if (!canAppendDecimal(prev)) return prev;
      const curr = String(prev[targetKey] || '');
      nextState[targetKey] = curr === '' ? '0.' : curr + '.';
      setDisplay(nextState.operator ? nextState.inputB || nextState.inputA || '0' : nextState.inputA || '0');
      auditDigit({ beforeState: beforeSnapshot, afterState: nextState, reason: 'decimal' });
      return nextState;
    });
  }, [beforeSnapshot]);

  const chooseOperator = useCallback((op) => {
    if (!validateOperator(op)) return;
    if (error) setError('');
    setState((prev) => {
      // chaining: if we already have a,b,op and b exists, compute first then set new operator
      if (prev.operator && prev.inputB !== '') {
        try {
          const result = calculate(prev.inputA, prev.operator, prev.inputB);
          const chained = { inputA: result, inputB: '', operator: op };
          setDisplay(result);
          auditOperator({ beforeState: beforeSnapshot, afterState: chained });
          return chained;
        } catch (e) {
          const msg = toUserMessage(e?.message || e);
          setError(msg);
          auditError({ beforeState: beforeSnapshot, afterState: prev, error: String(e) });
          return prev;
        }
      }
      const next = { ...prev, operator: op };
      auditOperator({ beforeState: beforeSnapshot, afterState: next });
      return next;
    });
  }, [error, beforeSnapshot]);

  const doBackspace = useCallback(() => {
    setState((prev) => {
      const targetKey = prev.operator ? 'inputB' : 'inputA';
      const curr = String(prev[targetKey] || '');
      if (!curr) return prev;
      const nextVal = curr.slice(0, -1);
      const nextState = { ...prev, [targetKey]: nextVal };
      setDisplay(nextState.operator ? (nextState.inputB || nextState.inputA || '0') : (nextState.inputA || '0'));
      auditDigit({ beforeState: beforeSnapshot, afterState: nextState, reason: 'backspace' });
      return nextState;
    });
  }, [beforeSnapshot]);

  const doClear = useCallback(() => {
    const confirmed = typeof window !== 'undefined' ? window.confirm('Clear all?') : true;
    if (!confirmed) return;
    const afterState = { inputA: '', inputB: '', operator: null };
    auditClear({ beforeState: beforeSnapshot, afterState });
    resetAll();
  }, [beforeSnapshot, resetAll]);

  const doCompute = useCallback(() => {
    if (!canCompute(state)) return;
    safeTry(
      () => {
        const result = calculate(state.inputA, state.operator, state.inputB);
        const afterState = { inputA: result, inputB: '', operator: null };
        setState(afterState);
        setDisplay(result);
        auditCompute({ beforeState: beforeSnapshot, afterState });
      },
      (e) => setError(toUserMessage(e?.message || e)),
      { beforeState: beforeSnapshot }
    );
  }, [state, beforeSnapshot]);

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
        return doClear();
      case '=':
        return doCompute();
      default:
        return null;
    }
  }, [appendDigit, appendDecimal, chooseOperator, doBackspace, doClear, doCompute]);

  return (
    <div className="calculator-wrap">
      <div className="calculator card" role="region" aria-label="Calculator">
        <h2 className="title">Ocean Calculator</h2>
        <Display value={display} error={error} />
        <Keypad onKeyPress={onKeyPress} />
      </div>
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
