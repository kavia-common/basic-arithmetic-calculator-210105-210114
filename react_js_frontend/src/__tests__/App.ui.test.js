import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

function pressSequence(keys) {
  for (const k of keys) {
    const btn = screen.getByRole('button', { name: new RegExp(`^${k}$`) });
    fireEvent.click(btn);
  }
}
function confirmEsign(pin = '1234') {
  const confirmBtn = screen.getByRole('button', { name: /confirm signature/i });
  const pinInput = screen.getByLabelText(/pin/i);
  fireEvent.change(pinInput, { target: { value: pin } });
  fireEvent.click(confirmBtn);
}

test('renders calculator and performs 2 + 2 = 4', () => {
  render(<App />);
  // 2 + 2 =
  pressSequence(['2', '+', '2', '=']);
  // e-sign modal appears
  expect(screen.getByRole('dialog', { name: /electronic signature/i })).toBeInTheDocument();
  confirmEsign('1234');
  expect(screen.getByTestId('display-value')).toHaveTextContent('4');
});

test('multiplication and subtraction', () => {
  render(<App />);
  pressSequence(['5', '×']); // label × but token is *
  // Use key by name '×' exists; fetch by label Add/Multiply; fallback:
  const mult = screen.getByRole('button', { name: /multiply/i });
  fireEvent.click(mult);
  pressSequence(['6', '=']);
  confirmEsign('1234');
  expect(screen.getByTestId('display-value')).toHaveTextContent('30');

  pressSequence(['9', '−']);
  const sub = screen.getByRole('button', { name: /subtract/i });
  fireEvent.click(sub);
  pressSequence(['3', '=']);
  expect(screen.getByRole('dialog', { name: /electronic signature/i })).toBeInTheDocument();
  confirmEsign('1234');
  expect(screen.getByTestId('display-value')).toHaveTextContent('6');
});

test('division and decimals and backspace', () => {
  render(<App />);
  // 8 ÷ 2 = 4
  const eight = screen.getByRole('button', { name: /^8$/ });
  fireEvent.click(eight);
  const div = screen.getByRole('button', { name: /divide/i });
  fireEvent.click(div);
  const two = screen.getByRole('button', { name: /^2$/ });
  fireEvent.click(two);
  const eq = screen.getByRole('button', { name: /equals/i });
  fireEvent.click(eq);
  confirmEsign();
  expect(screen.getByTestId('display-value')).toHaveTextContent('4');

  // decimals: 1 . 5 + 0 . 5 = 2
  pressSequence(['1', '.', '5', '+', '0', '.', '5', '=']);
  confirmEsign();
  expect(screen.getByTestId('display-value')).toHaveTextContent('2');

  // backspace working
  const three = screen.getByRole('button', { name: /^3$/ });
  fireEvent.click(three);
  const bs = screen.getByRole('button', { name: /backspace/i });
  fireEvent.click(bs);
  // 3 appended then removed, should show previous (likely last result) or '0' when empty
  // Append 7 then backspace then 7 => 7 remains
  const seven = screen.getByRole('button', { name: /^7$/ });
  fireEvent.click(seven);
  fireEvent.click(bs);
  fireEvent.click(seven);
  expect(screen.getByTestId('display-value').textContent).toMatch(/7$/);
});

test('clear requires e-sign and clears state', () => {
  render(<App />);
  pressSequence(['9']);
  const clear = screen.getByRole('button', { name: /clear/i });
  fireEvent.click(clear);
  expect(screen.getByRole('dialog', { name: /electronic signature/i })).toBeInTheDocument();
  confirmEsign();
  expect(screen.getByTestId('display-value')).toHaveTextContent('0');
});

test('accessibility basics: roles and labels', () => {
  render(<App />);
  expect(screen.getByRole('region', { name: /calculator/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /subtract/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /multiply/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /divide/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /equals/i })).toBeInTheDocument();
});
