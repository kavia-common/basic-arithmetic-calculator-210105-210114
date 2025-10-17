import { calculate } from '../components/Calculator';
import { canAppendDecimal, canCompute, enforceMaxLength, validateDigit, validateOperator } from '../lib/validation';
import { clear, getAll, auditCompute, auditClear, auditError } from '../lib/audit';
import { getDeviceId } from '../lib/auth';

beforeEach(() => {
  clear();
  // Clean localStorage audit item too for isolation
  try { localStorage.removeItem('calculator_audit_log_v1'); } catch (e) {}
  // Ensure deterministic deviceId for tests
  try { localStorage.setItem('calc.deviceId', '00000000-0000-4000-8000-000000000000'); } catch (e) {}
});

test('calculate() addition with decimals handles rounding and trimming', () => {
  expect(calculate('0.1', '+', '0.2')).toBe('0.3');
  expect(calculate('2.5000', '+', '0.5000')).toBe('3');
});

test('calculate() subtraction and multiplication', () => {
  expect(calculate('9', '-', '3')).toBe('6');
  expect(calculate('5', '*', '6')).toBe('30');
});

test('calculate() division and divide-by-zero guard', () => {
  expect(calculate('8', '/', '2')).toBe('4');
  expect(() => calculate('4', '/', '0')).toThrow(/divide/i);
});

test('validation: digit/operator', () => {
  expect(validateDigit('5')).toBe(true);
  expect(validateDigit('a')).toBe(false);
  expect(validateOperator('+')).toBe(true);
  expect(validateOperator('x')).toBe(false);
});

test('validation: canAppendDecimal prevents multiple decimals', () => {
  const s1 = { inputA: '12.3', inputB: '', operator: null };
  const s2 = { inputA: '12', inputB: '4.56', operator: '+' };
  const s3 = { inputA: '', inputB: '', operator: null };
  expect(canAppendDecimal(s1)).toBe(false);
  expect(canAppendDecimal(s2)).toBe(false);
  expect(canAppendDecimal(s3)).toBe(true);
});

test('validation: enforce max length', () => {
  expect(enforceMaxLength('12345678901234567', 16)).toHaveLength(16);
});

test('validation: canCompute true only when a,op,b valid', () => {
  expect(canCompute({ inputA: '2', operator: '+', inputB: '2' })).toBe(true);
  expect(canCompute({ inputA: '2.', operator: '+', inputB: '2' })).toBe(false);
  expect(canCompute({ inputA: '2', operator: '+', inputB: '' })).toBe(false);
});

test('audit: compute, clear, error entries have required fields', () => {
  const before = { inputA: '2', inputB: '2', operator: '+', display: '0', error: '' };
  const deviceId = getDeviceId();
  auditCompute({ beforeState: before, afterState: { result: '4' } });
  auditClear({ beforeState: before, afterState: { inputA: '', inputB: '', operator: null, display: '0', error: '' } });
  auditError({ beforeState: before, afterState: {}, error: 'Divide by zero' });
  const all = getAll();
  expect(all.length).toBe(3);
  for (const entry of all) {
    expect(entry.subjectId).toBe(deviceId);
    expect(new Date(entry.timestamp).toString()).not.toBe('Invalid Date');
    expect(['COMPUTE', 'CLEAR', 'ERROR', 'INPUT', 'OPERATOR']).toContain(entry.action);
  }
  // Ensure CLEAR entry specifically looks correct
  const clearEntry = all.find(e => e.action === 'CLEAR');
  expect(clearEntry).toBeTruthy();
  expect(clearEntry.before).toEqual(before);
  expect(clearEntry.after).toEqual({ inputA: '', inputB: '', operator: null, display: '0', error: '' });
});
