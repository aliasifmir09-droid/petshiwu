import { describe, expect, test } from 'vitest';
import { decodeHtmlEntities, extractFaqPairs } from '../htmlUtils';

describe('decodeHtmlEntities', () => {
  test('turns catalog apostrophes into a real apostrophe', () => {
    expect(decodeHtmlEntities("McLovin&#039;s Pet Premium")).toBe("McLovin's Pet Premium");
    expect(decodeHtmlEntities("McLovin&amp;#039;s Pet Premium")).toBe("McLovin's Pet Premium");
    expect(decodeHtmlEntities("Hill's Science Diet")).toBe("Hill's Science Diet");
  });
});

describe('extractFaqPairs', () => {
  test('pulls H2 questions and following paragraphs for FAQPage schema', () => {
    const pairs = extractFaqPairs(`
      <h2>How often should I feed my dog?</h2>
      <p>Most adult dogs do well with two meals a day, morning and evening.</p>
      <h2>What food is best for puppies?</h2>
      <p>Choose a complete puppy formula with DHA to support brain development.</p>
    `);
    expect(pairs).toHaveLength(2);
    expect(pairs[0]).toEqual({
      question: 'How often should I feed my dog?',
      answer: 'Most adult dogs do well with two meals a day, morning and evening.',
    });
  });

  test('returns an empty list when there is no article HTML', () => {
    expect(extractFaqPairs('')).toEqual([]);
    expect(extractFaqPairs('<p>Just a paragraph.</p>')).toEqual([]);
  });
});
