/// <reference types="node" />
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Check if Cloudinary is configured
export const isCloudinaryConfigured = (): boolean => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

// Cloudinary storage configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    try {
      // Determine resource type based on file mimetype
      const isVideo = file.mimetype.startsWith('video/');
      const resourceType = isVideo ? 'video' : 'image';
      
      // Create folder structure: pet-shop/{resource-type}
      const folder = `pet-shop/${resourceType}`;
      
      // Generate unique filename with original extension
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const originalExt = file.originalname.split('.').pop() || '';
      const filename = `${file.fieldname}-${uniqueSuffix}${originalExt ? '.' + originalExt : ''}`;
      
      const params: any = {
        folder: folder,
        public_id: filename,
        resource_type: resourceType,
        overwrite: false,
        invalidate: true,
        // Ensure we get the URL back
        return_delete_token: false,
      };
      
      // Image transformations
      if (resourceType === 'image') {
        params.transformation = [
          {
            quality: 'auto',
            fetch_format: 'auto',
          }
        ];
      }
      
      // Video transformations
      if (resourceType === 'video') {
        params.format = 'mp4';
        params.quality = 'auto';
      }
      
      console.log('Cloudinary upload params:', params);
      return params;
    } catch (error) {
      console.error('Error in Cloudinary storage params:', error);
      throw error;
    }
  },
});

// File filter for images and videos
const fileFilter = (
  req: any,
  file: { fieldname: string; originalname: string; mimetype: string },
  cb: multer.FileFilterCallback
) => {
  // Allow images and videos
  const allowedImageTypes = /jpeg|jpg|png|gif|webp|svg/;
  const allowedVideoTypes = /mp4|webm|ogg|mov|avi/;
  
  const extname = file.originalname.toLowerCase();
  const isImage = allowedImageTypes.test(extname) || file.mimetype.startsWith('image/');
  const isVideo = allowedVideoTypes.test(extname) || file.mimetype.startsWith('video/');
  
  if (isImage || isVideo) {
    return cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed'));
  }
};

// Multer configuration
export const cloudinaryUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size (for videos)
  },
});

// Helper function to get Cloudinary URL with CDN optimizations
export const getCloudinaryUrl = (
  publicId: string, 
  resourceType: 'image' | 'video' = 'image',
  options?: {
    width?: number;
    height?: number;
    quality?: string | number;
    format?: string;
    transformation?: any[];
  }
): string => {
  const defaultOptions: any = {
    resource_type: resourceType,
    secure: true,
    // CDN optimizations
    fetch_format: 'auto', // Auto-optimize format (WebP when supported)
    quality: 'auto', // Auto quality optimization
  };

  // Add size transformations if provided
  if (options?.width || options?.height) {
    defaultOptions.width = options.width;
    defaultOptions.height = options.height;
    defaultOptions.crop = 'limit'; // Maintain aspect ratio
  }

  // Add quality if specified
  if (options?.quality) {
    defaultOptions.quality = options.quality;
  }

  // Add format if specified
  if (options?.format) {
    defaultOptions.fetch_format = options.format;
  }

  // Add custom transformations if provided
  if (options?.transformation) {
    defaultOptions.transformation = options.transformation;
  }

  return cloudinary.url(publicId, defaultOptions);
};

// Helper to get optimized image URL for product listings
export const getOptimizedImageUrl = (publicId: string, size: 'thumbnail' | 'medium' | 'large' = 'medium'): string => {
  const sizes = {
    thumbnail: { width: 200, height: 200 },
    medium: { width: 500, height: 500 },
    large: { width: 1000, height: 1000 }
  };

  return getCloudinaryUrl(publicId, 'image', {
    ...sizes[size],
    quality: 'auto',
    format: 'auto'
  });
};

// Helper function to delete from Cloudinary
export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

export default cloudinary;

