import { describe, expect, test } from 'vitest';
import { photoSearchErrorMessage } from '../compressImage';

describe('photo search errors', () => {
  test('uses the API message when present', () => {
    expect(
      photoSearchErrorMessage({
        response: { status: 400, data: { message: 'No image provided' } },
        message: 'Request failed with status code 400',
      })
    ).toBe('No image provided');
  });

  test('explains payload-too-large without axios jargon', () => {
    expect(
      photoSearchErrorMessage({ response: { status: 413 }, message: 'Request failed with status code 413' })
    ).toMatch(/screenshot/i);
  });

  test('keeps local compression errors', () => {
    expect(
      photoSearchErrorMessage(new Error('This photo format is not supported. Take a screenshot of the product and upload that.'))
    ).toMatch(/screenshot/i);
  });
});
