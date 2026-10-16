import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import HomeHeroSlogans from '../HomeHeroSlogans';
import { HOME_PROMO_TILES, HOME_SLOGAN_SUPPORT } from '@/data/brandStories';
import { HERO_H1 } from '@/utils/deliveryZones';

describe('HomeHeroSlogans', () => {
  test('leads nationwide with one primary shop button and stocked category tiles', () => {
    render(
      <MemoryRouter>
        <HomeHeroSlogans />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(HERO_H1);
    expect(screen.getByText(HOME_SLOGAN_SUPPORT)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /dog, cat, and macaw/i })).toHaveAttribute(
      'src',
      '/hero-wide-family.jpg'
    );
    const shop = screen.getByRole('link', { name: /^shop now$/i });
    expect(shop).toHaveAttribute('href', '/products');
    for (const tile of HOME_PROMO_TILES) {
      expect(screen.getByRole('heading', { name: tile.title })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: new RegExp(tile.title, 'i') })).toHaveAttribute('href', tile.to);
    }
    expect(screen.queryByText(/nationwide shipping opens/i)).not.toBeInTheDocument();
  });
});
