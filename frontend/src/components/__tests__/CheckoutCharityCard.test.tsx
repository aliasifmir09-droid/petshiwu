import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import CheckoutCharityCard from '../CheckoutCharityCard';

describe('CheckoutCharityCard', () => {
  test('lets a shopper add an optional shelter donation and skip it', () => {
    const onChange = vi.fn();
    const { rerender } = render(<CheckoutCharityCard amount={0} onChange={onChange} />);

    expect(screen.getByText('Help a shelter pet')).toBeInTheDocument();
    expect(screen.getByText(/animal rescue and shelter care/i)).toBeInTheDocument();
    expect(screen.getByText(/optional/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Donate $5 to animal rescue' }));
    expect(onChange).toHaveBeenCalledWith(5);

    rerender(<CheckoutCharityCard amount={5} onChange={onChange} />);
    expect(screen.getByText('$5.00 added for shelter support')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Remove donation' }));
    expect(onChange).toHaveBeenCalledWith(0);
  });

  test('accepts a custom donation amount without submitting the checkout form', () => {
    const onChange = vi.fn();
    render(<CheckoutCharityCard amount={0} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Other amount' }));
    const input = screen.getByLabelText('Custom donation amount');
    fireEvent.change(input, { target: { value: '7.50' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith(7.5);
  });
});
