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
    // Determine resource type based on file mimetype
    const isVideo = file.mimetype.startsWith('video/');
    const resourceType = isVideo ? 'video' : 'image';
    
    // Create folder structure: pet-shop/{resource-type}/{optional-subfolder}
    const folder = `pet-shop/${resourceType}`;
    
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `${file.fieldname}-${uniqueSuffix}`;
    
    return {
      folder: folder,
      public_id: filename,
      resource_type: resourceType,
      // Image transformations
      transformation: resourceType === 'image' ? [
        {
          quality: 'auto',
          fetch_format: 'auto',
        }
      ] : undefined,
      // Video transformations
      ...(resourceType === 'video' ? {
        format: 'mp4',
        quality: 'auto',
      } : {}),
    };
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

// Helper function to get Cloudinary URL
export const getCloudinaryUrl = (publicId: string, resourceType: 'image' | 'video' = 'image'): string => {
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    secure: true,
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

