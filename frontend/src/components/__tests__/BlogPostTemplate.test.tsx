import { render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import BlogPostTemplate, { learningArticleCanonical } from '../BlogPostTemplate';

describe('BlogPostTemplate', () => {
  test('canonical uses the route slug, not a slugified title', () => {
    expect(learningArticleCanonical('best-dog-foods-sensitive-stomachs', '10 Best Dog Foods for Sensitive Stomachs [2024 Guide]')).toBe(
      'https://www.petshiwu.com/learning/best-dog-foods-sensitive-stomachs'
    );
    expect(
      learningArticleCanonical(undefined, '10 Best Dog Foods for Sensitive Stomachs [2024 Guide]')
    ).not.toContain('[2024-guide]');

    render(
      <HelmetProvider>
        <MemoryRouter>
          <BlogPostTemplate
            title="10 Best Dog Foods for Sensitive Stomachs [2024 Guide]"
            slug="best-dog-foods-sensitive-stomachs"
            description="Guide for sensitive stomachs"
            keywords={['dog food']}
            publishDate="2024-01-15"
            content={<p>Transition slowly.</p>}
          />
        </MemoryRouter>
      </HelmetProvider>
    );

    expect(screen.getByRole('heading', { level: 1, name: /10 Best Dog Foods/i })).toBeInTheDocument();
    expect(screen.getByText('Transition slowly.')).toBeInTheDocument();
  });
});
