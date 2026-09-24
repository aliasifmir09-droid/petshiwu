import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import HomeHeroSlogans from '../HomeHeroSlogans';
import { HOME_PROMO_TILES, HOME_SLOGAN, HOME_SLOGAN_SUPPORT } from '@/data/brandStories';
import { FIRST_ORDER_CODE } from '@/config/publicPromos';

describe('HomeHeroSlogans', () => {
  test('leads with the first-order offer and two campaign tiles', () => {
    render(
      <MemoryRouter>
        <HomeHeroSlogans />
      </MemoryRouter>
    );

    expect(screen.getByText(FIRST_ORDER_CODE)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(HOME_SLOGAN);
    expect(screen.getByText(HOME_SLOGAN_SUPPORT)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /dog, cat, and macaw/i })).toHaveAttribute(
      'src',
      '/hero-wide-family.jpg'
    );
    expect(screen.getByRole('link', { name: /shop now/i })).toHaveAttribute('href', '/products');
    for (const tile of HOME_PROMO_TILES) {
      expect(screen.getByRole('heading', { name: tile.title })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: new RegExp(tile.label, 'i') })).toHaveAttribute(
        'href',
        tile.to
      );
    }
    expect(screen.queryByText(/nationwide shipping opens/i)).not.toBeInTheDocument();
  });
});
