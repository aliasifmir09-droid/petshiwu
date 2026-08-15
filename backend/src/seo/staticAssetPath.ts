/**
 * SPA catch-all must not serve index.html for missing files like /og-image.jpg.
 * Google Images treated that HTML thumbnail as a gray placeholder.
 */
export function looksLikeStaticAsset(pathname: string): boolean {
  const pathOnly = pathname.split('?')[0] || '';
  return /\.[a-zA-Z0-9]{1,8}$/.test(pathOnly);
}
