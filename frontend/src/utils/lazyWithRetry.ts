import { ComponentType, lazy, LazyExoticComponent } from 'react';

const CHUNK_RELOAD_KEY = 'psw-chunk-reload';

export const isChunkLoadError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error || '');
  return /Failed to fetch dynamically imported module|Loading chunk|Importing a module script failed|error loading dynamically imported module/i.test(
    message
  );
};

export const reloadOnceForStaleChunk = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return false;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
    window.location.reload();
    return true;
  } catch {
    return false;
  }
};

export function lazyWithRetry<T extends ComponentType<unknown>>(
  importer: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await importer();
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      try {
        return await importer();
      } catch (retryError) {
        if (isChunkLoadError(retryError) && reloadOnceForStaleChunk()) {
          return new Promise(() => undefined as never);
        }
        throw retryError;
      }
    }
  });
}
