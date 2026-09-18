import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import HomeHeroSlogans from '../HomeHeroSlogans';
import { BRAND_STORY_LIST, HOME_SLOGAN, NATIONWIDE_SOON_NOTE } from '@/data/brandStories';

describe('HomeHeroSlogans', () => {
  test('shows the catalog slogan and shop-by-pet links', () => {
    render(
      <MemoryRouter>
        <HomeHeroSlogans />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(HOME_SLOGAN);
    expect(screen.getByText('Petshiwu')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /dog, cat, and macaw/i })).toHaveAttribute(
      'src',
      '/hero-wide-family.jpg'
    );
    expect(screen.getByText(NATIONWIDE_SOON_NOTE)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /shop dogs/i })).toHaveAttribute('href', '/dog');
    expect(screen.getByRole('link', { name: /shop cats/i })).toHaveAttribute('href', '/cat');
    expect(screen.getByRole('link', { name: /shop all/i })).toHaveAttribute('href', '/products');
    for (const story of BRAND_STORY_LIST) {
      expect(screen.getByRole('link', { name: new RegExp(story.slogan, 'i') })).toHaveAttribute(
        'href',
        story.path
      );
    }
  });
});
