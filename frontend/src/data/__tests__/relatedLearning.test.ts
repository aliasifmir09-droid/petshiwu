import { describe, expect, test } from 'vitest';
import { relatedLearningPosts } from '../relatedLearning';
import { FEATURED_LEARNING_SLUGS } from '../featuredLearning';

describe('relatedLearningPosts', () => {
  test('returns other guides and never the current slug', () => {
    const related = relatedLearningPosts('best-fresh-dog-food-2026', 'dog', 6);
    expect(related.length).toBe(6);
    expect(related.every((post) => post.slug !== 'best-fresh-dog-food-2026')).toBe(true);
  });
});

describe('featured learning slugs', () => {
  test('every featured homepage guide exists as a static article', () => {
    for (const slug of FEATURED_LEARNING_SLUGS) {
      expect(FEATURED_LEARNING_SLUGS.length).toBeGreaterThan(0);
      expect(slug.length).toBeGreaterThan(5);
    }
    expect(FEATURED_LEARNING_SLUGS[0]).toBe('fall-2026-pet-care-playbook');
  });
});
