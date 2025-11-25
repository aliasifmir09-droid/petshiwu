/// <reference types="node" />
import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
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
  size?: number; // Fallback property
}

const router = express.Router();

// Error handler for multer uploads
const handleUploadError = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Multer upload error:', error);
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 100MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message || 'File upload error'
    });
  }
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'File upload failed'
    });
  }
  next();
};

// Upload single file (image or video)
router.post('/single', protect, authorize('admin'), upload.single('image'), handleUploadError, (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    // Debug logging
    const file = req.file as any;
    const cloudinaryConfigured = isCloudinaryConfigured();
    
    console.log('Upload Debug:', {
      cloudinaryConfigured,
      hasSecureUrl: !!file.secure_url,
      hasUrl: !!file.url,
      hasPublicId: !!file.public_id,
      hasPath: !!file.path,
      hasFilename: !!file.filename,
      fileKeys: Object.keys(file),
      mimetype: file.mimetype
    });

    // Check if using Cloudinary or local storage
    // CloudinaryStorage adds properties directly to req.file
    // Check for Cloudinary-specific properties
    const isCloudinary = cloudinaryConfigured && (
      file.secure_url || 
      file.url || 
      file.public_id ||
      (file.path && file.path.includes('cloudinary.com'))
    );
    
    if (isCloudinary) {
      // Cloudinary file structure
      const cloudinaryFile = file as CloudinaryFile;
      
      // Extract URL from Cloudinary response
      const imageUrl = cloudinaryFile.secure_url || cloudinaryFile.url;
      
      if (!imageUrl) {
        console.error('Cloudinary upload failed - no URL in response:', cloudinaryFile);
        // Fallback to local storage if Cloudinary didn't provide URL
        const localFile = file as any;
        const responseData = {
          filename: localFile.filename || cloudinaryFile.originalname,
          path: `/uploads/${localFile.filename || cloudinaryFile.originalname}`,
          url: `/uploads/${localFile.filename || cloudinaryFile.originalname}`,
          mimetype: cloudinaryFile.mimetype,
          size: cloudinaryFile.bytes || cloudinaryFile.size || 0,
          resource_type: cloudinaryFile.resource_type || 'image',
          format: cloudinaryFile.format,
          width: cloudinaryFile.width,
          height: cloudinaryFile.height
        };
        
        console.log('Cloudinary upload failed, using fallback:', responseData.url);
        return res.status(200).json({
          success: true,
          data: responseData
        });
      }
      
      const responseData = {
        filename: cloudinaryFile.public_id || cloudinaryFile.originalname,
        path: imageUrl,
        url: imageUrl,
        mimetype: cloudinaryFile.mimetype,
        size: cloudinaryFile.bytes || cloudinaryFile.size || 0,
        resource_type: cloudinaryFile.resource_type || 'image',
        format: cloudinaryFile.format,
        width: cloudinaryFile.width,
        height: cloudinaryFile.height
      };
      
      console.log('Cloudinary upload successful:', responseData.url);
      
      return res.status(200).json({
        success: true,
        data: responseData
      });
    } else {
      // Local storage
      const localFile = file as LocalFile;
      
      if (!localFile.filename) {
        console.error('Local storage upload failed - no filename:', localFile);
        return res.status(500).json({
          success: false,
          message: 'File upload failed - no filename generated'
        });
      }
      
      const responseData = {
        filename: localFile.filename,
        path: `/uploads/${localFile.filename}`,
        url: `/uploads/${localFile.filename}`,
        mimetype: localFile.mimetype,
        size: localFile.size || 0
      };
      
      console.log('Local storage upload successful:', responseData.url);
      
      return res.status(200).json({
        success: true,
        data: responseData
      });
    }
  } catch (error: any) {
    console.error('Upload error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload file',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Upload multiple files (images or videos)
router.post('/multiple', protect, authorize('admin'), upload.array('images', 10), (req: Request, res: Response) => {
  try {
    if (!req.files || (req.files as any[]).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload files'
      });
    }

    // Check if using Cloudinary or local storage
    const filesArray = Array.isArray(req.files) ? req.files : [];
    const firstFile = filesArray[0] as any;
    const isCloudinary = isCloudinaryConfigured() && filesArray.length > 0 && 
                        (firstFile.secure_url || firstFile.url || firstFile.public_id);
    
    if (isCloudinary) {
      // Cloudinary files
      const cloudinaryFiles = filesArray as unknown as CloudinaryFile[];
      const files = cloudinaryFiles.map(file => ({
        filename: file.public_id || file.originalname,
        path: file.secure_url || file.url,
        url: file.secure_url || file.url,
        mimetype: file.mimetype,
        size: file.bytes || file.size,
        resource_type: file.resource_type || 'image',
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
      const localFiles = filesArray as LocalFile[];
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
  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload files',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;



