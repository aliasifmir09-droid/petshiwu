import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import HomeHeroSlogans from '../HomeHeroSlogans';
import { BRAND_STORY_LIST, HOME_SLOGAN } from '@/data/brandStories';

describe('HomeHeroSlogans', () => {
  test('shows the homepage slogan and links to the new story pages', () => {
    render(
      <MemoryRouter>
        <HomeHeroSlogans />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(HOME_SLOGAN);
    expect(screen.getByRole('link', { name: /shop now/i })).toHaveAttribute('href', '/products');
    for (const story of BRAND_STORY_LIST) {
      expect(screen.getByRole('link', { name: new RegExp(story.slogan, 'i') })).toHaveAttribute(
        'href',
        story.path
      );
    }
  });
});
