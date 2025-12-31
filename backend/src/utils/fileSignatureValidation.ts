/**
 * File signature (magic bytes) validation utility
 * Validates file types by checking actual file content, not just MIME type or extension
 * This prevents MIME type spoofing attacks
 */

import fs from 'fs';
import { Readable } from 'stream';

// File signatures (magic bytes) for common file types
const FILE_SIGNATURES: { [key: string]: Array<{ offset: number; bytes: number[] }> } = {
  // Images
  'image/jpeg': [
    { offset: 0, bytes: [0xFF, 0xD8, 0xFF] }, // JPEG
  ],
  'image/png': [
    { offset: 0, bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }, // PNG
  ],
  'image/gif': [
    { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }, // GIF87a
    { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }, // GIF89a
  ],
  'image/webp': [
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF
    { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }, // WEBP
  ],
  'image/svg+xml': [
    { offset: 0, bytes: [0x3C, 0x3F, 0x78, 0x6D, 0x6C] }, // <?xml
    { offset: 0, bytes: [0x3C, 0x73, 0x76, 0x67] }, // <svg
  ],
  
  // Videos
  'video/mp4': [
    { offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }, // ftyp (at offset 4)
    { offset: 0, bytes: [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70] }, // MP4 variant
  ],
  'video/webm': [
    { offset: 0, bytes: [0x1A, 0x45, 0xDF, 0xA3] }, // WebM
  ],
  'video/ogg': [
    { offset: 0, bytes: [0x4F, 0x67, 0x67, 0x53] }, // OggS
  ],
  'video/quicktime': [
    { offset: 4, bytes: [0x66, 0x74, 0x79, 0x70, 0x71, 0x74] }, // ftypqt (QuickTime)
  ],
};

/**
 * Read bytes from a buffer at a specific offset
 */
const readBytes = (buffer: Buffer, offset: number, length: number): number[] => {
  const bytes: number[] = [];
  for (let i = 0; i < length && offset + i < buffer.length; i++) {
    bytes.push(buffer[offset + i]);
  }
  return bytes;
};

/**
 * Check if buffer matches a signature pattern
 */
const matchesSignature = (buffer: Buffer, signature: { offset: number; bytes: number[] }): boolean => {
  const fileBytes = readBytes(buffer, signature.offset, signature.bytes.length);
  if (fileBytes.length !== signature.bytes.length) {
    return false;
  }
  return signature.bytes.every((byte, index) => fileBytes[index] === byte);
};

/**
 * Validate file signature against expected MIME type
 * @param filePath - Path to the file
 * @param expectedMimeType - Expected MIME type
 * @returns Promise<boolean> - True if signature matches
 */
export const validateFileSignature = async (
  filePath: string,
  expectedMimeType: string
): Promise<boolean> => {
  try {
    const signatures = FILE_SIGNATURES[expectedMimeType];
    if (!signatures) {
      // If no signature defined for this type, allow it (for unknown types)
      // In production, you might want to reject unknown types
      return true;
    }

    // Read first 32 bytes (enough for most signatures)
    const buffer = Buffer.alloc(32);
    const fd = await fs.promises.open(filePath, 'r');
    try {
      await fd.read(buffer, 0, 32, 0);
    } finally {
      await fd.close();
    }

    // Check if any signature matches
    return signatures.some(signature => matchesSignature(buffer, signature));
  } catch (error) {
    // If we can't read the file, fail validation
    return false;
  }
};

/**
 * Validate file signature from a buffer (for in-memory files)
 * @param buffer - File buffer
 * @param expectedMimeType - Expected MIME type
 * @returns boolean - True if signature matches
 */
export const validateFileSignatureFromBuffer = (
  buffer: Buffer,
  expectedMimeType: string
): boolean => {
  try {
    const signatures = FILE_SIGNATURES[expectedMimeType];
    if (!signatures) {
      // If no signature defined for this type, allow it
      return true;
    }

    // Check if any signature matches
    return signatures.some(signature => matchesSignature(buffer, signature));
  } catch (error) {
    // If validation fails, reject
    return false;
  }
};

/**
 * Get MIME type from file signature (reverse lookup)
 * @param buffer - File buffer
 * @returns string | null - Detected MIME type or null
 */
export const detectMimeTypeFromSignature = (buffer: Buffer): string | null => {
  for (const [mimeType, signatures] of Object.entries(FILE_SIGNATURES)) {
    if (signatures.some(signature => matchesSignature(buffer, signature))) {
      return mimeType;
    }
  }
  return null;
};

