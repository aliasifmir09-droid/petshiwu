/// <reference types="node" />
import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { upload } from '../middleware/upload';
import { protect, authorize } from '../middleware/auth';
import { isCloudinaryConfigured, getCloudinaryUrl } from '../utils/cloudinary';

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
    
    // Safe logging - don't log full file object in production
    if (process.env.NODE_ENV === 'development') {
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
    }

    // Check if using Cloudinary or local storage
    // CloudinaryStorage adds properties directly to req.file
    // Check for Cloudinary-specific properties
    const isCloudinary = cloudinaryConfigured && (
      file.secure_url || 
      file.url || 
      file.public_id ||
      (file.path && file.path.includes('cloudinary.com')) ||
      (file as any).result ||
      (file as any).response
    );
    
    if (isCloudinary) {
      // Cloudinary file structure - multer-storage-cloudinary stores result in different places
      const cloudinaryFile = file as any;
      
      // Extract URL from Cloudinary response - check multiple possible locations
      let imageUrl = null;
      
      // Check direct properties first
      if (cloudinaryFile.secure_url) {
        imageUrl = cloudinaryFile.secure_url;
      } else if (cloudinaryFile.url) {
        imageUrl = cloudinaryFile.url;
      }
      // Check result object (common in multer-storage-cloudinary)
      else if (cloudinaryFile.result) {
        imageUrl = cloudinaryFile.result.secure_url || cloudinaryFile.result.url;
      }
      // Check response object
      else if (cloudinaryFile.response) {
        imageUrl = cloudinaryFile.response.secure_url || cloudinaryFile.response.url;
      }
      // Check if path contains cloudinary.com
      else if (cloudinaryFile.path && cloudinaryFile.path.includes('cloudinary.com')) {
        imageUrl = cloudinaryFile.path;
      }
      
      if (!imageUrl) {
        console.error('❌ Cloudinary upload - no URL found. Checking all possible locations...');
        console.error('File object keys:', Object.keys(cloudinaryFile));
        console.error('Direct properties:', {
          secure_url: cloudinaryFile.secure_url,
          url: cloudinaryFile.url,
          path: cloudinaryFile.path,
          public_id: cloudinaryFile.public_id,
          resource_type: cloudinaryFile.resource_type
        });
        console.error('Result object:', cloudinaryFile.result);
        console.error('Response object:', cloudinaryFile.response);
        console.error('Full file object (first 1000 chars):', JSON.stringify(cloudinaryFile, null, 2).substring(0, 1000));
        
        // Try to get public_id from multiple locations
        let publicId = cloudinaryFile.public_id || 
                      cloudinaryFile.result?.public_id || 
                      cloudinaryFile.response?.public_id;
        
        // Try to construct URL from public_id if available
        if (publicId) {
          try {
            const resourceType = (cloudinaryFile.resource_type || 
                                 cloudinaryFile.result?.resource_type || 
                                 cloudinaryFile.response?.resource_type || 
                                 'image') as 'image' | 'video';
            
            const constructedUrl = getCloudinaryUrl(publicId, resourceType);
            if (constructedUrl && constructedUrl.includes('cloudinary.com')) {
              console.log('✅ Constructed Cloudinary URL from public_id:', constructedUrl);
              
              // Get other properties from result/response if available
              const result = cloudinaryFile.result || cloudinaryFile.response || cloudinaryFile;
              
              const responseData = {
                filename: publicId,
                path: constructedUrl,
                url: constructedUrl,
                mimetype: cloudinaryFile.mimetype || result.mimetype,
                size: result.bytes || cloudinaryFile.bytes || cloudinaryFile.size || 0,
                resource_type: resourceType,
                format: result.format || cloudinaryFile.format,
                width: result.width || cloudinaryFile.width,
                height: result.height || cloudinaryFile.height
              };
              return res.status(200).json({
                success: true,
                data: responseData
              });
            }
          } catch (error) {
            console.error('Error constructing URL from public_id:', error);
          }
        }
        
        // Final check - look for any URL-like string in the entire object
        const fileString = JSON.stringify(cloudinaryFile);
        const urlMatch = fileString.match(/https?:\/\/[^\s"']+cloudinary\.com[^\s"']+/);
        if (urlMatch) {
          const foundUrl = urlMatch[0];
          console.log('✅ Found Cloudinary URL in object string:', foundUrl);
          const responseData = {
            filename: publicId || cloudinaryFile.originalname,
            path: foundUrl,
            url: foundUrl,
            mimetype: cloudinaryFile.mimetype,
            size: cloudinaryFile.bytes || cloudinaryFile.size || 0,
            resource_type: cloudinaryFile.resource_type || 'image',
            format: cloudinaryFile.format,
            width: cloudinaryFile.width,
            height: cloudinaryFile.height
          };
          return res.status(200).json({
            success: true,
            data: responseData
          });
        }
        
        // Final fallback - return error with detailed info
        return res.status(500).json({
          success: false,
          message: 'Cloudinary upload failed - no URL returned. Please check Cloudinary configuration and credentials.',
          debug: process.env.NODE_ENV === 'development' ? {
            hasSecureUrl: !!cloudinaryFile.secure_url,
            hasUrl: !!cloudinaryFile.url,
            hasPublicId: !!cloudinaryFile.public_id,
            hasResult: !!(file as any).result,
            hasResponse: !!(file as any).response,
            fileKeys: Object.keys(file),
            cloudinaryConfigured: isCloudinaryConfigured()
          } : undefined
        });
      }
      
      // Get other properties from result/response if available, otherwise use direct properties
      const result = cloudinaryFile.result || cloudinaryFile.response || cloudinaryFile;
      const publicId = result.public_id || cloudinaryFile.public_id;
      
      const responseData = {
        filename: publicId || cloudinaryFile.originalname,
        path: imageUrl,
        url: imageUrl,
        mimetype: cloudinaryFile.mimetype || result.mimetype,
        size: result.bytes || cloudinaryFile.bytes || cloudinaryFile.size || 0,
        resource_type: result.resource_type || cloudinaryFile.resource_type || 'image',
        format: result.format || cloudinaryFile.format,
        width: result.width || cloudinaryFile.width,
        height: result.height || cloudinaryFile.height
      };
      
      console.log('✅ Cloudinary upload successful! URL:', responseData.url);
      
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



