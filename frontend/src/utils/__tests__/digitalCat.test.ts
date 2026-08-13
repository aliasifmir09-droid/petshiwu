import { describe, expect, test } from 'vitest';
import { DIGITAL_CAT_FRAMES } from '../../components/DigitalCat';

describe('digital cat animation', () => {
  test('has a 3-frame HD run cycle', () => {
    expect(DIGITAL_CAT_FRAMES).toHaveLength(3);
    expect(DIGITAL_CAT_FRAMES.every((src) => src.endsWith('.webp'))).toBe(true);
  });
});
