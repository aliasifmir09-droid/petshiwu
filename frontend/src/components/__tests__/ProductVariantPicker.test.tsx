import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import ProductVariantPicker from '../ProductVariantPicker';
import { ProductVariant } from '@/types';

const bag = (size: string, price: number, sku: string): ProductVariant => ({
  size,
  weight: size,
  price,
  stock: 10,
  sku,
  attributes: {},
});

describe('ProductVariantPicker', () => {
  test('shows one Size grid instead of duplicate Size and Weight rows', () => {
    const onSelect = vi.fn();
    render(
      <ProductVariantPicker
        variants={[
          bag('5 Lb', 16.99, '5'),
          bag('15 Lb', 39.99, '15'),
          bag('34 Lb', 82.49, '34'),
        ]}
        selectedIndex={2}
        onSelect={onSelect}
      />
    );

    expect(screen.getAllByText(/^Size/).length).toBe(1);
    expect(screen.queryByText(/^Weight/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /5 lb, \$16\.99/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /34 lb, \$82\.49, selected/i })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: /15 lb, \$39\.99/i }));
    expect(onSelect).toHaveBeenCalledWith(1);
  });
});
