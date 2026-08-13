/**
 * Generate sitemap.xml at build time from the live backend sitemap.
 *
 * This intentionally fails closed: a backend fetch or XML validation failure
 * must fail the frontend build rather than replacing the sitemap with stale
 * or incomplete data.
 */
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_PATH = path.join(__dirname, '../public/sitemap.xml');
const SITEMAP_SOURCES = [
  process.env.SITEMAP_URL,
  'https://petshiwu.onrender.com/sitemap.xml',
  process.env.VITE_API_URL
    ? process.env.VITE_API_URL.replace('/api', '') + '/sitemap.xml'
    : null,
].filter(Boolean);

const XML_NAME = '[A-Za-z_][A-Za-z0-9_.:-]*';
const XML_ENTITY = '&(?:amp|lt|gt|quot|apos|#[0-9]+|#x[0-9A-Fa-f]+);';
const INDEXABLE_ROOTS = new Set([
  '', 'products', 'learning', 'care-guides', 'about', 'faq', 'returns',
  'return-policy', 'donate', 'contact', 'shipping', 'shipping-policy',
  'other-animals', 'privacy', 'privacy-policy', 'terms', 'terms-of-service',
  'accessibility', 'shop', 'fish-tanks', 'press', 'investors', 'sell-with-us',
  'vendors', 'partners', 'innovation', 'tech', 'symptom-checker',
  'dog', 'cat', 'bird', 'fish', 'reptile', 'small-pet',
  'small-animal',
]);

function decodeXml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function sanitizeLegacySitemapEntries(xml) {
  const seenPaths = new Set();
  let removed = 0;
  const sanitized = xml.replace(/<url>[\s\S]*?<\/url>/g, (block) => {
    const match = block.match(/<loc>([^<]+)<\/loc>/);
    if (!match) {
      removed += 1;
      return '';
    }

    const rawLoc = decodeXml(match[1].trim());
    let parsed;
    try {
      parsed = new URL(rawLoc);
    } catch {
      removed += 1;
      return '';
    }

    const pathname = parsed.pathname.replace(/\/+$/, '') || '/';
    const segments = pathname.split('/').filter(Boolean);
    const isLegacyProduct = segments[0] === 'products' && segments.length === 2;
    const isSingleUnknownRoot = segments.length === 1 && !INDEXABLE_ROOTS.has(segments[0]);
    const invalid = !/^https?:$/i.test(parsed.protocol)
      || /\s/.test(rawLoc)
      || parsed.search
      || parsed.hash
      || isLegacyProduct
      || isSingleUnknownRoot
      || seenPaths.has(pathname);

    if (invalid) {
      removed += 1;
      return '';
    }
    seenPaths.add(pathname);
    return block;
  });

  return { xml: sanitized, removed };
}

function assertXmlText(value, context) {
  if (value.includes('&') && new RegExp(`&(?!${XML_ENTITY.slice(1, -1)})`).test(value)) {
    throw new Error(`Invalid XML entity in ${context}`);
  }
}

function parseXmlTag(token) {
  const body = token.slice(1, -1).trim();
  const selfClosing = /\/$/.test(body);
  const content = selfClosing ? body.slice(0, -1).trim() : body;
  const nameMatch = content.match(new RegExp(`^(${XML_NAME})(?:\\s|$)`));
  if (!nameMatch) throw new Error(`Invalid XML tag: ${token}`);

  const name = nameMatch[1];
  const attributes = {};
  const attributesText = content.slice(name.length);
  let cursor = 0;
  const attributePattern = new RegExp(`^\\s+(${XML_NAME})\\s*=\\s*("[^"]*"|'[^']*')`);

  while (cursor < attributesText.length) {
    const match = attributesText.slice(cursor).match(attributePattern);
    if (!match) throw new Error(`Invalid XML attributes on <${name}>`);
    if (attributes[match[1]] !== undefined) {
      throw new Error(`Duplicate XML attribute ${match[1]} on <${name}>`);
    }
    const value = match[2].slice(1, -1);
    assertXmlText(value, `attribute ${match[1]}`);
    attributes[match[1]] = value;
    cursor += match[0].length;
  }

  return { name, attributes, selfClosing };
}

/**
 * Validate XML structure and the sitemap root/URL contract without adding a
 * runtime dependency solely for build-time validation.
 */
function validateSitemapXml(xml) {
  if (typeof xml !== 'string' || !xml.trim()) {
    throw new Error('Sitemap response is empty');
  }

  const input = xml.replace(/^\uFEFF/, '').trim();
  if (!/^<\?xml\s+version\s*=\s*["']1\.0["'][^?]*\?>/.test(input)) {
    throw new Error('Sitemap is missing a valid XML declaration');
  }
  if (/<!DOCTYPE\b/i.test(input)) {
    throw new Error('Sitemap must not contain a DOCTYPE declaration');
  }

  const stack = [];
  let root;
  let rootClosed = false;
  let urlCount = 0;
  const seenLocs = new Set();
  const seenPaths = new Set();
  let position = 0;

  const appendText = (text) => {
    assertXmlText(text, 'text');
    if (!text.trim()) return;
    if (!stack.length) throw new Error('Sitemap contains text outside the root element');
    stack[stack.length - 1].text += text;
  };

  while (position < input.length) {
    if (input[position] !== '<') {
      const nextTag = input.indexOf('<', position);
      appendText(input.slice(position, nextTag === -1 ? input.length : nextTag));
      position = nextTag === -1 ? input.length : nextTag;
      continue;
    }

    if (input.startsWith('<!--', position)) {
      const end = input.indexOf('-->', position + 4);
      if (end === -1) throw new Error('Unterminated XML comment');
      position = end + 3;
      continue;
    }

    if (input.startsWith('<![CDATA[', position)) {
      const end = input.indexOf(']]>', position + 9);
      if (end === -1) throw new Error('Unterminated CDATA section');
      appendText(input.slice(position + 9, end));
      position = end + 3;
      continue;
    }

    if (input.startsWith('<?', position)) {
      const end = input.indexOf('?>', position + 2);
      if (end === -1) throw new Error('Unterminated XML processing instruction');
      position = end + 2;
      continue;
    }

    let end = position + 1;
    let quote;
    for (; end < input.length; end += 1) {
      const character = input[end];
      if (quote) {
        if (character === quote) quote = undefined;
      } else if (character === '"' || character === "'") {
        quote = character;
      } else if (character === '>') {
        break;
      }
    }
    if (end >= input.length || quote) throw new Error('Unterminated XML tag');

    const token = input.slice(position, end + 1);
    if (token.startsWith('</')) {
      const name = token.slice(2, -1).trim();
      if (!new RegExp(`^${XML_NAME}$`).test(name) || !stack.length) {
        throw new Error(`Invalid XML closing tag: ${token}`);
      }
      const element = stack.pop();
      if (element.name !== name) {
        throw new Error(`Mismatched XML closing tag: expected </${element.name}>`);
      }
      if (name === 'loc') {
        const rawLoc = element.text.trim();
        const decodedLoc = rawLoc
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'");
        if (!rawLoc || !/^https?:\/\//i.test(decodedLoc)) {
          throw new Error('Sitemap <loc> must contain an absolute HTTP(S) URL');
        }
        if (/\s/.test(decodedLoc) || decodedLoc.includes('?') || decodedLoc.includes('#')) {
          throw new Error(`Sitemap <loc> contains whitespace or a query/hash variant: ${decodedLoc}`);
        }
        let parsedLoc;
        try { parsedLoc = new URL(decodedLoc); } catch {
          throw new Error(`Sitemap <loc> is invalid: ${decodedLoc}`);
        }
        const normalizedLoc = parsedLoc.toString();
        const normalizedPath = parsedLoc.pathname.replace(/\/+$/, '') || '/';
        if (seenLocs.has(normalizedLoc) || seenPaths.has(normalizedPath)) {
          throw new Error(`Sitemap contains a duplicate URL or pathname: ${decodedLoc}`);
        }
        seenLocs.add(normalizedLoc);
        seenPaths.add(normalizedPath);
      }
      if (name === 'url') {
        if (element.locCount !== 1) throw new Error('Each sitemap <url> must contain exactly one <loc>');
        urlCount += 1;
      }
      if (!stack.length) rootClosed = true;
    } else {
      const tag = parseXmlTag(token);
      if (!root) {
        if (tag.name !== 'urlset') throw new Error(`Sitemap root must be <urlset>, got <${tag.name}>`);
        if (tag.attributes.xmlns !== 'http://www.sitemaps.org/schemas/sitemap/0.9') {
          throw new Error('Sitemap <urlset> has an invalid or missing sitemap namespace');
        }
        root = tag.name;
      } else if (rootClosed) {
        throw new Error('Sitemap contains content after the root element');
      }

      if (tag.name === 'url') {
        if (!stack.length || stack[stack.length - 1].name !== 'urlset') {
          throw new Error('Sitemap <url> elements must be direct children of <urlset>');
        }
      }
      if (tag.name === 'loc') {
        if (!stack.length || stack[stack.length - 1].name !== 'url') {
          throw new Error('Sitemap <loc> elements must be direct children of <url>');
        }
        stack[stack.length - 1].locCount += 1;
      }

      const element = { name: tag.name, text: '', locCount: 0 };
      if (!tag.selfClosing) stack.push(element);
    }
    position = end + 1;
  }

  if (!root || !rootClosed || stack.length) throw new Error('Sitemap XML is not well-formed');
  if (urlCount === 0) throw new Error('Sitemap contains no <url> entries');
  return input.endsWith('\n') ? input : `${input}\n`;
}

function fetchSitemap(url) {
  return new Promise((resolve, reject) => {
    console.log(`📡 Trying: ${url}`);
    const req = https.get(url, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        // Validate after the compatibility sanitizer runs. The first backend
        // deploy must be able to consume the legacy sitemap long enough to
        // ship the backend's authoritative final filter.
        resolve(data);
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

function writeAtomically(filePath, contents) {
  const temporaryPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(temporaryPath, contents, { encoding: 'utf8', mode: 0o644 });
    fs.renameSync(temporaryPath, filePath);
  } finally {
    if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
  }
}

async function generateSitemap() {
  console.log('🔍 Generating sitemap.xml...');
  const failures = [];

  for (const source of SITEMAP_SOURCES) {
    try {
      const rawXml = await fetchSitemap(source);
      const { xml: sanitizedXml, removed } = sanitizeLegacySitemapEntries(rawXml);
      const xml = validateSitemapXml(sanitizedXml);
      writeAtomically(OUTPUT_PATH, xml);
      console.log(`✅ Sitemap fetched, sanitized, and validated from backend: ${source}`);
      console.log(`📊 Size: ${(xml.length / 1024).toFixed(2)} KB; removed ${removed} invalid/noncanonical entries`);
      return;
    } catch (error) {
      failures.push(`${source}: ${error.message}`);
      console.warn(`⚠️  ${source} failed: ${error.message}`);
    }
  }

  throw new Error(`Sitemap generation failed; no valid backend sitemap was available. ${failures.join(' | ')}`);
}

generateSitemap().catch((error) => {
  console.error(`❌ ${error.message}`);
  process.exitCode = 1;
});
