import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import BrandLogo from '../BrandLogo';

describe('BrandLogo', () => {
  test('renders the official Petshiwu wordmark', () => {
    render(<BrandLogo />);
    const img = screen.getByRole('img', { name: /petshiwu/i });
    expect(img).toHaveAttribute('src', '/logo.png');
  });

  test('keeps a white plate on dark backgrounds so the navy lockup stays readable', () => {
    const { container } = render(<BrandLogo variant="on-navy" />);
    expect(container.firstChild).toHaveClass('bg-white');
    expect(screen.getByRole('img', { name: /petshiwu/i })).toBeInTheDocument();
  });
});
