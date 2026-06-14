/**
 * Cloudinary has been replaced with Bunny CDN for all image storage.
 * This file stubs the original cloudinary API so existing imports continue
 * to compile and run — isCloudinaryConfigured() always returns false,
 * routing all upload paths to local/Bunny storage instead.
 */
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const isCloudinaryConfigured = (): boolean => false;

export const cloudinaryUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 },
});

export const getCloudinaryUrl = (_publicId: string, _resourceType?: string, _options?: any): string => '';
export const getOptimizedImageUrl = (_publicId: string, _size?: string): string => '';
export const deleteFromCloudinary = async (_publicId: string): Promise<void> => {};

export default null;
