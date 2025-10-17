import { append, getAll, clear, exportJson } from '../lib/audit';
import { getDeviceId } from '../lib/auth';

beforeEach(() => {
  clear();
  try { localStorage.removeItem('calculator_audit_log_v1'); } catch (e) {}
  try { localStorage.setItem('calc.deviceId', '00000000-0000-4000-8000-000000000000'); } catch (e) {}
});

test('audit entries include required fields and persist to localStorage', () => {
  const before = { a: '1', op: '+', b: '1' };
  const after = { result: '2' };
  const deviceId = getDeviceId();
  append({
    action: 'COMPUTE',
    before: before,
    after: after,
    metadata: { reason: 'unit' },
  });
  const all = getAll();
  expect(all.length).toBe(1);
  const entry = all[0];
  expect(entry.subjectId).toBe(deviceId);
  expect(new Date(entry.timestamp).toString()).not.toBe('Invalid Date');
  expect(entry.action).toBe('COMPUTE');
  expect(entry.before).toEqual(before);
  expect(entry.after).toEqual(after);
  // persistence
  const raw = localStorage.getItem('calculator_audit_log_v1');
  expect(raw).toBeTruthy();
  const exported = exportJson();
  expect(JSON.parse(exported).length).toBe(1);
});
