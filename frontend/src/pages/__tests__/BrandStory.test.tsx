import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { describe, expect, test } from 'vitest';
import BrandStory from '../BrandStory';
import { BRAND_STORIES } from '@/data/brandStories';

describe('BrandStory pages', () => {
  test.each(Object.values(BRAND_STORIES))('$slug renders its slogan and shop CTA', (story) => {
    render(
      <HelmetProvider>
        <MemoryRouter>
          <BrandStory slug={story.slug} />
        </MemoryRouter>
      </HelmetProvider>
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(story.slogan);
    expect(screen.getByRole('link', { name: story.ctaLabel })).toHaveAttribute('href', '/products');
    expect(screen.getByText(story.sections[0].heading)).toBeInTheDocument();
  });
});
