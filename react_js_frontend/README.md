# Ocean Professional Calculator (React)

Modern, accessible calculator with GxP controls: audit trail, validation, error handling, and e-signature for critical operations.

## Getting Started
- npm start
- npm test
- npm run build

No external dependencies beyond React and testing library included with CRA.

## Usage
- Click buttons or use keyboard: digits 0-9, + - * /, ., Enter/=, Backspace, C/Escape.
- '=' and 'C' trigger e-sign modal. PIN: 1234

## Ocean Professional Theme
- Primary: #2563EB
- Secondary/Success: #F59E0B
- Error: #EF4444
- Background: #f9fafb
- Surface: #ffffff
- Text: #111827

## REQUIREMENT TRACEABILITY
- REQ-CALC-001: Auth context (src/lib/auth.js)
- REQ-CALC-002: Audit trail (src/lib/audit.js)
- REQ-CALC-003: Validation (src/lib/validation.js)
- REQ-CALC-004: Error handling (src/lib/errorHandling.js)
- REQ-CALC-005: Calculator state and operations (src/components/Calculator.js)

Traceability Matrix:
- Requirement → Implementation → Tests
  - REQ-CALC-001 → src/lib/auth.js → App.ui.test.js (signature flow)
  - REQ-CALC-002 → src/lib/audit.js → audit.validation.test.js; Calculator.unit.test.js (audit section)
  - REQ-CALC-003 → src/lib/validation.js → Calculator.unit.test.js
  - REQ-CALC-004 → src/lib/errorHandling.js → Calculator.unit.test.js (divide-by-zero test indirectly)
  - REQ-CALC-005 → src/components/Calculator.js → App.ui.test.js; Calculator.unit.test.js

## GxP Compliance Summary
- Attributable: userId captured from AuthProvider.
- Contemporaneous: Timestamp ISO 8601 on events.
- Complete/Accurate: Before/after state in audit entries.
- Enduring: localStorage persistence for audit.
- Access Controls: Role field present; extend for RBAC.
- Electronic Signature: Required for compute '=' and clear 'C', PIN verification, signature bound in audit entries.

## Assumptions and Constraints
- Mock authentication with fixed user and PIN (1234).
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
- [x] Security controls (PIN-based e-sign) verified
- [x] Performance acceptable for UI
- [x] Code review ready
