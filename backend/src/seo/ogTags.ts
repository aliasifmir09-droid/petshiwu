/**
 * Open Graph / Twitter share tags for bot-rendered HTML.
 *
 * Google Images and social crawlers read these from the first HTML response.
 * The default share image is a real 1200×630 JPEG at /og-image.jpg — never
 * the square logo, and never a missing path that the SPA would serve as HTML.
 */

export const SITE_ORIGIN = 'https://www.petshiwu.com';
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.jpg`;
export const BUNNY_CDN_ORIGIN = 'https://petshiwu-cdn.b-cdn.net';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Cloudinary cloud dtmes0dha is disabled ("cloud_name ... is disabled" / HTTP 401).
 * Product photos live on Bunny CDN as /products/{filename}.
 */
export function toPublicProductImageUrl(url: string): string | undefined {
  const value = String(url || '').trim();
  if (!value) return undefined;
  if (/res\.cloudinary\.com/i.test(value)) {
    const file = value.match(/\/products\/([^/?#]+)/i)?.[1];
    if (!file) return undefined;
    return `${BUNNY_CDN_ORIGIN}/products/${file}`;
  }
  if (/^https?:\/\//i.test(value)) return value;
  return `${SITE_ORIGIN}${value.startsWith('/') ? value : `/${value}`}`;
}

/** Turn a product/blog image (URL, relative path, or {url}) into an absolute share URL. */
export function resolveShareImage(raw?: unknown): string {
  if (typeof raw === 'string') {
    return toPublicProductImageUrl(raw) || DEFAULT_OG_IMAGE;
  }
  if (raw && typeof raw === 'object') {
    const url = (raw as { url?: unknown }).url;
    if (typeof url === 'string') return resolveShareImage(url);
  }
  return DEFAULT_OG_IMAGE;
}

function upsertMeta(html: string, attr: 'property' | 'name', key: string, content: string): string {
  const attrRe = `${attr}=["']${key}["']`;
  const re = new RegExp(
    `(<meta\\b[^>]*\\b${attrRe}[^>]*\\bcontent=["'])[^"']*(["'][^>]*>)`,
    'i'
  );
  if (re.test(html)) {
    return html.replace(re, `$1${esc(content)}$2`);
  }
  const reContentFirst = new RegExp(
    `(<meta\\b[^>]*\\bcontent=["'])[^"']*(["'][^>]*\\b${attrRe}[^>]*>)`,
    'i'
  );
  if (reContentFirst.test(html)) {
    return html.replace(reContentFirst, `$1${esc(content)}$2`);
  }
  return html.replace(
    /<\/head>/i,
    `    <meta ${attr}="${key}" content="${esc(content)}" />\n  </head>`
  );
}

/**
 * Set og/twitter title, description, url, type, and image on a page template.
 * Missing tags are injected so every crawlable page has a real share image.
 */
export function injectOgTags(
  html: string,
  title: string,
  description: string,
  url: string,
  ogType = 'website',
  image?: string
): string {
  const shareImage = resolveShareImage(image);
  let out = html;
  out = upsertMeta(out, 'property', 'og:title', title);
  out = upsertMeta(out, 'property', 'og:description', description);
  out = upsertMeta(out, 'property', 'og:url', url);
  out = upsertMeta(out, 'property', 'og:type', ogType);
  out = upsertMeta(out, 'property', 'og:image', shareImage);
  out = upsertMeta(out, 'property', 'og:image:secure_url', shareImage);
  out = upsertMeta(out, 'property', 'og:image:width', '1200');
  out = upsertMeta(out, 'property', 'og:image:height', '630');
  out = upsertMeta(out, 'property', 'og:image:alt', title);
  out = upsertMeta(out, 'name', 'twitter:title', title);
  out = upsertMeta(out, 'name', 'twitter:description', description);
  out = upsertMeta(out, 'name', 'twitter:url', url);
  out = upsertMeta(out, 'name', 'twitter:image', shareImage);
  out = upsertMeta(out, 'name', 'twitter:card', 'summary_large_image');
  if (!/rel=["']image_src["']/i.test(out)) {
    out = out.replace(
      /<\/head>/i,
      `    <link rel="image_src" href="${esc(shareImage)}" />\n  </head>`
    );
  } else {
    out = out.replace(
      /(<link\b[^>]*rel=["']image_src["'][^>]*href=["'])[^"']*(["'][^>]*>)/i,
      `$1${esc(shareImage)}$2`
    );
  }
  return out;
}
