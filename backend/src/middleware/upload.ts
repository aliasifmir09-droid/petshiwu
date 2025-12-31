/// <reference types="node" />
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { cloudinaryUpload, isCloudinaryConfigured } from '../utils/cloudinary';
import logger from '../utils/logger';

// Fallback to local storage if Cloudinary is not configured
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// SECURITY FIX: Enhanced file filter with initial validation
// File signature validation happens after upload in the route handler
const fileFilter = (req: any, file: { fieldname: string; originalname: string; mimetype: string }, cb: FileFilterCallback) => {
  try {
    // Allow images and videos
    const allowedImageTypes = /jpeg|jpg|png|gif|webp|svg/;
    const allowedVideoTypes = /mp4|webm|ogg|mov|avi/;
    
    const extname = file.originalname.toLowerCase();
    const isImage = allowedImageTypes.test(extname) || file.mimetype.startsWith('image/');
    const isVideo = allowedVideoTypes.test(extname) || file.mimetype.startsWith('video/');
    
    if (!isImage && !isVideo) {
      return cb(new Error('Only image and video files are allowed'));
    }
    
    return cb(null, true);
  } catch (error: any) {
    logger.error('File filter error:', error);
    return cb(new Error('File validation failed'));
  }
};

const localUpload = multer({
  storage: localStorage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max file size (for videos)
  }
});

// Use Cloudinary if configured, otherwise fall back to local storage
// Add error handling wrapper for Cloudinary uploads
const cloudinaryUploadWithErrorHandling = (req: any, res: any, next: any) => {
  cloudinaryUpload.single('image')(req, res, (err: any) => {
    if (err) {
      console.error('Cloudinary upload error:', err);
      // If Cloudinary fails, we could fall back to local storage here
      // For now, just pass the error
      return next(err);
    }
    next();
  });
};

export const upload = isCloudinaryConfigured() ? cloudinaryUpload : localUpload;



