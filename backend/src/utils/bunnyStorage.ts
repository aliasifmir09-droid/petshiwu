/**
 * Bunny Storage upload utility
 * Replaces Cloudinary for all new uploads (pet photos, admin product images, etc.)
 * Storage zone: "petshiwu" (ID 1550772, NY region)
 * CDN pull zone: https://petshiwu-cdn.b-cdn.net
 */

import https from 'https';
import { URL } from 'url';

const STORAGE_ZONE = 'petshiwu';
const STORAGE_HOST = 'ny.storage.bunnycdn.com';
const CDN_HOST = 'petshiwu-cdn.b-cdn.net';
const STORAGE_PASSWORD = process.env.BUNNY_STORAGE_PASSWORD || '';

/**
 * Upload a base64-encoded image to Bunny Storage.
 * Returns the public CDN URL.
 *
 * @param base64Data  Full data URI (data:image/jpeg;base64,...) or raw base64 string
 * @param folder      Storage folder path, e.g. 'petshiwu/pets'
 * @param filename    File name without extension — extension derived from MIME type
 */
export const uploadToBunny = (
  base64Data: string,
  folder: string,
  filename: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!STORAGE_PASSWORD) {
      return reject(new Error('BUNNY_STORAGE_PASSWORD env var not set'));
    }

    // Parse data URI if present
    let mimeType = 'image/jpeg';
    let rawBase64 = base64Data;
    const dataUriMatch = base64Data.match(/^data:([^;]+);base64,(.+)$/);
    if (dataUriMatch) {
      mimeType = dataUriMatch[1];
      rawBase64 = dataUriMatch[2];
    }

    const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const safeFilename = filename.replace(/[^a-z0-9_-]/gi, '_');
    const remotePath = `/${STORAGE_ZONE}/${folder}/${safeFilename}.${ext}`;
    const buffer = Buffer.from(rawBase64, 'base64');

    const options = {
      hostname: STORAGE_HOST,
      path: remotePath,
      method: 'PUT',
      headers: {
        AccessKey: STORAGE_PASSWORD,
        'Content-Type': mimeType,
        'Content-Length': buffer.length,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          // CDN URL mirrors storage path (minus /petshiwu prefix)
          const cdnPath = `/${folder}/${safeFilename}.${ext}`;
          const cdnUrl = `https://${CDN_HOST}${cdnPath}`;
          resolve(cdnUrl);
        } else {
          reject(new Error(`Bunny upload failed: HTTP ${res.statusCode} — ${body}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(buffer);
    req.end();
  });
};

/**
 * Delete a file from Bunny Storage by its CDN URL.
 * Silently ignores errors (non-blocking cleanup).
 */
export const deleteFromBunny = async (cdnUrl: string): Promise<void> => {
  if (!STORAGE_PASSWORD || !cdnUrl.includes(CDN_HOST)) return;
  try {
    const parsed = new URL(cdnUrl);
    const remotePath = `/${STORAGE_ZONE}${parsed.pathname}`;
    await new Promise<void>((resolve) => {
      const req = https.request(
        { hostname: STORAGE_HOST, path: remotePath, method: 'DELETE', headers: { AccessKey: STORAGE_PASSWORD } },
        () => resolve()
      );
      req.on('error', () => resolve());
      req.end();
    });
  } catch {
    // best-effort
  }
};
