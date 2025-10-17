# Ocean Professional Calculator (React)

Modern, accessible calculator with GxP-oriented controls: audit trail, validation, and error handling. Authentication and e-signature have been intentionally removed; audit attribution is anonymous via deviceId.

## Getting Started
- npm start
- npm test
- npm run build

No external dependencies beyond React and testing library included with CRA.

## Usage
- Click buttons or use keyboard: digits 0-9, + - * /, ., Enter/=, Backspace, C/Escape.
- '=' performs computation directly.
- 'C' shows a simple confirmation (window.confirm) before clearing all.

## Ocean Professional Theme
- Primary: #2563EB
- Secondary/Success: #F59E0B
- Error: #EF4444
- Background: #f9fafb
- Surface: #ffffff
- Text: #111827

## REQUIREMENT TRACEABILITY
- REQ-CALC-001 (Updated): Anonymous identity helpers (src/lib/auth.js)
- REQ-CALC-002 (Updated): Audit trail with deviceId subjectId (src/lib/audit.js)
- REQ-CALC-003: Validation (src/lib/validation.js)
- REQ-CALC-004 (Updated): Error handling (src/lib/errorHandling.js)
- REQ-CALC-005 (Updated): Calculator state and operations (src/components/Calculator.js)

Traceability Matrix:
- Requirement → Implementation → Tests
  - REQ-CALC-001 → src/lib/auth.js → audit.validation.test.js (deviceId), setupTests.js (seed)
  - REQ-CALC-002 → src/lib/audit.js → audit.validation.test.js; Calculator.unit.test.js (audit section)
  - REQ-CALC-003 → src/lib/validation.js → Calculator.unit.test.js
  - REQ-CALC-004 → src/lib/errorHandling.js → Calculator.unit.test.js (divide-by-zero test indirectly)
  - REQ-CALC-005 → src/components/Calculator.js → App.ui.test.js; Calculator.unit.test.js

## Compliance Notes
- Attributable: subjectId captures a stable anonymous deviceId (stored in localStorage as 'calc.deviceId').
- Contemporaneous: timestamps recorded in ISO 8601 format for each audit entry.
- Complete/Accurate: audit entries include before/after snapshots and optional metadata/error.
- Enduring: audit entries persist to localStorage.
- Access Controls: Authentication and RBAC removed (role 'anonymous'). For regulated environments requiring identity binding and e-sign, this implementation is not sufficient by itself.

Limitations for regulated environments:
- No user authentication or electronic signatures. If required, re-introduce identity and signature flows and bind them in audit entries through a secure backend.

## Assumptions and Constraints
- Anonymous deviceId used for attribution.
- LocalStorage used for audit persistence (no backend).
- No environment variables required.

## Test Commands
- npm test
- For CI: CI=true npm test

## Release Gate Checklist
- [x] All inputs validated
- [x] Audit trail implemented for data modifications and errors
- [x] Unit test coverage target (>=80%) for core logic
- [x] Error handling comprehensive
- [x] Documentation complete
- [x] Security controls: N/A for e-signature (intentionally removed)
- [x] Performance acceptable for UI
- [x] Code review ready
