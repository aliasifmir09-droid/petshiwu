import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import HomeHeroSlogans from '../HomeHeroSlogans';
import {
  BRAND_STORY_LIST,
  HOME_OFFER_STRIP,
  HOME_SLOGAN,
  NATIONWIDE_SOON_NOTE,
} from '@/data/brandStories';
import { FIRST_ORDER_CODE } from '@/config/publicPromos';

describe('HomeHeroSlogans', () => {
  test('shows the offer, trust slogan, and shop links', () => {
    render(
      <MemoryRouter>
        <HomeHeroSlogans />
      </MemoryRouter>
    );

    expect(screen.getByText(HOME_OFFER_STRIP)).toBeInTheDocument();
    expect(screen.getByText(/nyc same-day delivery/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(HOME_SLOGAN);
    expect(screen.getByText(FIRST_ORDER_CODE)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /dog, cat, and macaw/i })).toHaveAttribute(
      'src',
      '/hero-wide-family.jpg'
    );
    expect(screen.getByText(NATIONWIDE_SOON_NOTE)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /shop now/i })).toHaveAttribute('href', '/products');
    expect(screen.getByRole('link', { name: /shop dogs/i })).toHaveAttribute('href', '/dog');
    expect(screen.getByRole('link', { name: /shop cats/i })).toHaveAttribute('href', '/cat');
    expect(screen.getByText('PayPal checkout')).toBeInTheDocument();
    expect(screen.getAllByText(/no autoship/i).length).toBeGreaterThan(0);
    for (const story of BRAND_STORY_LIST) {
      expect(screen.getByRole('link', { name: new RegExp(story.slogan, 'i') })).toHaveAttribute(
        'href',
        story.path
      );
    }
  });
});
