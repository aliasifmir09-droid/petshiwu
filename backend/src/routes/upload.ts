import express, { Request, Response } from 'express';
import { upload } from '../middleware/upload';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Upload single image
router.post('/single', protect, authorize('admin'), upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a file'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      mimetype: req.file.mimetype,
      size: req.file.size
    }
  });
});

// Upload multiple images
router.post('/multiple', protect, authorize('admin'), upload.array('images', 5), (req: Request, res: Response) => {
  if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please upload files'
    });
  }

  const files = (req.files as Express.Multer.File[]).map(file => ({
    filename: file.filename,
    path: `/uploads/${file.filename}`,
    mimetype: file.mimetype,
    size: file.size
  }));

  res.status(200).json({
    success: true,
    data: files
  });
});

export default router;



