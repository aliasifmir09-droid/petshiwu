import { isChunkLoadError } from '../lazyWithRetry';

describe('isChunkLoadError', () => {
  test('detects the first-click lazy import failures browsers throw', () => {
    expect(
      isChunkLoadError(new Error('Failed to fetch dynamically imported module: https://www.petshiwu.com/assets/Learning.js'))
    ).toBe(true);
    expect(isChunkLoadError(new Error('Importing a module script failed.'))).toBe(true);
    expect(isChunkLoadError(new Error('Loading chunk 142 failed'))).toBe(true);
    expect(isChunkLoadError(new Error('Cannot read properties of undefined'))).toBe(false);
  });
});
