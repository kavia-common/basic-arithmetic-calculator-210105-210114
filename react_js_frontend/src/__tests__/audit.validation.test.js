import { append, getAll, clear, exportJson } from '../lib/audit';

beforeEach(() => {
  clear();
  try { localStorage.removeItem('calculator_audit_log_v1'); } catch (e) {}
});

test('audit entries include required fields and persist to localStorage', () => {
  const before = { a: '1', op: '+', b: '1' };
  const after = { result: '2' };
  append({
    userId: 'user-001',
    actionType: 'UPDATE',
    beforeState: before,
    afterState: after,
    reason: 'unit',
    signature: { verified: true, method: 'pin' },
  });
  const all = getAll();
  expect(all.length).toBe(1);
  const entry = all[0];
  expect(entry.userId).toBe('user-001');
  expect(new Date(entry.timestamp).toString()).not.toBe('Invalid Date');
  expect(entry.actionType).toBe('UPDATE');
  expect(entry.beforeState).toEqual(before);
  expect(entry.afterState).toEqual(after);
  // persistence
  const raw = localStorage.getItem('calculator_audit_log_v1');
  expect(raw).toBeTruthy();
  const exported = exportJson();
  expect(JSON.parse(exported).length).toBe(1);
});
