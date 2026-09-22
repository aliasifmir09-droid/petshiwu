import express from 'express';
import request from 'supertest';
import {
  applyMerchantFeedHeaders,
  getMerchantFeedXml,
  googleMerchantFeed,
  isReusableMerchantFeed,
  resetMerchantFeedCache,
  seedMerchantFeedCacheForTests,
} from '../../../controllers/merchantFeedController';

const SAMPLE_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Petshiwu</title>
    <item><g:id>ps-1</g:id><g:title>Test food</g:title></item>
  </channel>
</rss>
`;

describe('merchantFeedController', () => {
  afterEach(() => {
    resetMerchantFeedCache();
  });

  test('a reusable feed must contain items and a closing rss tag', () => {
    expect(isReusableMerchantFeed(SAMPLE_FEED)).toBe(true);
    expect(isReusableMerchantFeed('<?xml version="1.0"?><rss></rss>')).toBe(false);
    expect(isReusableMerchantFeed('')).toBe(false);
  });

  test('Merchant Center headers never send X-Robots-Tag noindex', () => {
    const res = {
      headers: {} as Record<string, string>,
      setHeader(name: string, value: string) {
        this.headers[name.toLowerCase()] = value;
      },
      removeHeader(name: string) {
        delete this.headers[name.toLowerCase()];
      },
    };
    res.headers['x-robots-tag'] = 'noindex';
    applyMerchantFeedHeaders(res as never);
    expect(res.headers['content-type']).toBe('application/xml; charset=utf-8');
    expect(res.headers['x-robots-tag']).toBeUndefined();
  });

  test('serves stale feed immediately while a rebuild is in flight', async () => {
    seedMerchantFeedCacheForTests(SAMPLE_FEED, Date.now() - 2 * 60 * 60 * 1000);
    let started = false;
    let resolveBuild: (xml: string) => void = () => undefined;
    const pending = new Promise<string>((resolve) => {
      resolveBuild = resolve;
    });

    const result = getMerchantFeedXml(() => {
      started = true;
      return pending;
    });

    await Promise.resolve();
    expect(started).toBe(true);
    await expect(result).resolves.toBe(SAMPLE_FEED);
    resolveBuild(SAMPLE_FEED.replace('ps-1', 'ps-2'));
  });

  test('GET /feeds/google.xml returns cached XML without a robots noindex header', async () => {
    seedMerchantFeedCacheForTests(SAMPLE_FEED);
    const app = express();
    app.use((_req, res, next) => {
      // Simulate helmet / bot middleware tagging every response.
      res.setHeader('X-Robots-Tag', 'noindex');
      next();
    });
    app.get('/feeds/google.xml', googleMerchantFeed);

    const res = await request(app).get('/feeds/google.xml');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/xml/);
    expect(res.headers['x-robots-tag']).toBeUndefined();
    expect(res.text).toContain('<item>');
    expect(res.text).toContain('</rss>');
  });

  test('HEAD /feeds/google.xml returns 200 and Content-Length without a body', async () => {
    seedMerchantFeedCacheForTests(SAMPLE_FEED);
    const app = express();
    app.head('/feeds/google.xml', googleMerchantFeed);

    const res = await request(app).head('/feeds/google.xml');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/xml/);
    expect(res.headers['content-length']).toBe(String(Buffer.byteLength(SAMPLE_FEED, 'utf8')));
    expect(res.headers['x-robots-tag']).toBeUndefined();
    expect(res.text).toBeFalsy();
  });
});
