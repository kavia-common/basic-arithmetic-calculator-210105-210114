import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

function pressSequence(keys) {
  for (const k of keys) {
    const btn = screen.getByRole('button', { name: new RegExp(`^${k}$`) });
    fireEvent.click(btn);
  }
}

test('renders calculator and performs 2 + 2 = 4 without prompts', () => {
  render(<App />);
  // 2 + 2 =
  pressSequence(['2', '+', '2', '=']);
  expect(screen.getByTestId('display-value')).toHaveTextContent('4');
});

test('multiplication and subtraction', () => {
  render(<App />);
  // 5 × 6 = 30
  pressSequence(['5']);
  const mult = screen.getByRole('button', { name: /multiply/i });
  fireEvent.click(mult);
  pressSequence(['6', '=']);
  expect(screen.getByTestId('display-value')).toHaveTextContent('30');

  // 9 − 3 = 6
  pressSequence(['9']);
  const sub = screen.getByRole('button', { name: /subtract/i });
  fireEvent.click(sub);
  pressSequence(['3', '=']);
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
  expect(screen.getByTestId('display-value')).toHaveTextContent('4');

  // decimals: 1 . 5 + 0 . 5 = 2
  pressSequence(['1', '.', '5', '+', '0', '.', '5', '=']);
  expect(screen.getByTestId('display-value')).toHaveTextContent('2');

  // backspace working
  const three = screen.getByRole('button', { name: /^3$/ });
  fireEvent.click(three);
  const bs = screen.getByRole('button', { name: /backspace/i });
  fireEvent.click(bs);
  // Append 7 then backspace then 7 => 7 remains
  const seven = screen.getByRole('button', { name: /^7$/ });
  fireEvent.click(seven);
  fireEvent.click(bs);
  fireEvent.click(seven);
  expect(screen.getByTestId('display-value').textContent).toMatch(/7$/);
});

test('clear uses simple confirm and clears state when confirmed', () => {
  // mock window.confirm to accept
  const originalConfirm = window.confirm;
  window.confirm = jest.fn(() => true);
  render(<App />);
  pressSequence(['9']);
  const clear = screen.getByRole('button', { name: /clear/i });
  fireEvent.click(clear);
  expect(window.confirm).toHaveBeenCalled();
  expect(screen.getByTestId('display-value')).toHaveTextContent('0');
  window.confirm = originalConfirm;
});

test('clear confirmation cancel preserves state', () => {
  const originalConfirm = window.confirm;
  window.confirm = jest.fn(() => false);
  render(<App />);
  pressSequence(['1', '2', '3']);
  const clear = screen.getByRole('button', { name: /clear/i });
  fireEvent.click(clear);
  // Should not clear when user cancels
  expect(screen.getByTestId('display-value')).toHaveTextContent('123');
  window.confirm = originalConfirm;
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
