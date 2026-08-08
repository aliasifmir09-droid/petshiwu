import express from 'express';
import multer from 'multer';
import { driverOnly } from '../middleware/driverAuth';
import {
  getDriverMe,
  getTodayRuns,
  getDriverStop,
  updateDriverStopStatus,
  uploadDriverProof
} from '../controllers/driverController';

const router = express.Router();
const driverUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype.toLowerCase())) {
      return cb(new Error('Delivery proof must be a JPEG, PNG, or WebP image'));
    }
    cb(null, true);
  }
});

router.use(...driverOnly);
router.get('/me', getDriverMe);
router.get('/runs/today', getTodayRuns);
router.get('/stops/:orderId', getDriverStop);
router.patch('/stops/:orderId/status', updateDriverStopStatus);
router.post('/stops/:orderId/proof', driverUpload.single('image'), uploadDriverProof);

export default router;
