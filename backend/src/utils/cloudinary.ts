/**
 * Cloudinary replaced with Bunny CDN. This stub keeps existing imports
 * compiling — isCloudinaryConfigured() always returns false.
 */
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const localStorage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => cb(null, uploadsDir),
  filename: (_req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

export const isCloudinaryConfigured = (): boolean => false;

export const cloudinaryUpload = multer({
  storage: localStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
});

export const getCloudinaryUrl = (_publicId: string, _resourceType?: string, _options?: any): string => '';
export const getOptimizedImageUrl = (_publicId: string, _size?: string): string => '';
export const deleteFromCloudinary = async (_publicId: string): Promise<void> => {};

export default null;
