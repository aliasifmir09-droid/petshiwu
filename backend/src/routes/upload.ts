/// <reference types="node" />
import express, { Request, Response } from 'express';
import { upload } from '../middleware/upload';
import { protect, authorize } from '../middleware/auth';
import { isCloudinaryConfigured } from '../utils/cloudinary';

// Type for multer file (local storage)
interface LocalFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  filename: string;
  path: string;
  size: number;
}

// Type for Cloudinary file
interface CloudinaryFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  public_id: string;
  secure_url: string;
  url: string;
  resource_type: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
}

const router = express.Router();

// Upload single file (image or video)
router.post('/single', protect, authorize('admin'), upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a file'
    });
  }

  // Check if using Cloudinary or local storage
  if (isCloudinaryConfigured() && 'secure_url' in req.file) {
    const cloudinaryFile = req.file as unknown as CloudinaryFile;
    return res.status(200).json({
      success: true,
      data: {
        filename: cloudinaryFile.public_id,
        path: cloudinaryFile.secure_url,
        url: cloudinaryFile.secure_url,
        mimetype: cloudinaryFile.mimetype,
        size: cloudinaryFile.bytes,
        resource_type: cloudinaryFile.resource_type,
        format: cloudinaryFile.format,
        width: cloudinaryFile.width,
        height: cloudinaryFile.height
      }
    });
  } else {
    // Local storage
    const localFile = req.file as LocalFile;
    return res.status(200).json({
      success: true,
      data: {
        filename: localFile.filename,
        path: `/uploads/${localFile.filename}`,
        url: `/uploads/${localFile.filename}`,
        mimetype: localFile.mimetype,
        size: localFile.size
      }
    });
  }
});

// Upload multiple files (images or videos)
router.post('/multiple', protect, authorize('admin'), upload.array('images', 10), (req: Request, res: Response) => {
  if (!req.files || (req.files as any[]).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please upload files'
    });
  }

  // Check if using Cloudinary or local storage
  const filesArray = Array.isArray(req.files) ? req.files : [];
  if (isCloudinaryConfigured() && filesArray.length > 0 && 'secure_url' in filesArray[0]) {
    const cloudinaryFiles = filesArray as unknown as CloudinaryFile[];
    const files = cloudinaryFiles.map(file => ({
      filename: file.public_id,
      path: file.secure_url,
      url: file.secure_url,
      mimetype: file.mimetype,
      size: file.bytes,
      resource_type: file.resource_type,
      format: file.format,
      width: file.width,
      height: file.height
    }));

    return res.status(200).json({
      success: true,
      data: files
    });
  } else {
    // Local storage
    const localFiles = req.files as LocalFile[];
    const files = localFiles.map(file => ({
      filename: file.filename,
      path: `/uploads/${file.filename}`,
      url: `/uploads/${file.filename}`,
      mimetype: file.mimetype,
      size: file.size
    }));

    return res.status(200).json({
      success: true,
      data: files
    });
  }
});

export default router;



