import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import { prepareOrderDelivery, updateDelivery, createDeliveryRun, listDeliveryRuns, getDeliveryRun, optimizeDeliveryRun, uploadDeliveryProof, getDeliveryProof } from '../controllers/deliveryController';

const router = express.Router();
const deliveryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype.toLowerCase())) {
      return cb(new Error('Delivery proof must be a JPEG, PNG, or WebP image'));
    }
    cb(null, true);
  }
});
router.use(protect, checkPermission('canManageDelivery'));
router.post('/runs', createDeliveryRun);
router.get('/runs', listDeliveryRuns);
router.get('/runs/:runId', getDeliveryRun);
router.post('/runs/:runId/optimize', optimizeDeliveryRun);
router.post('/orders/:id/prepare', prepareOrderDelivery);
router.put('/orders/:id', updateDelivery);
router.get('/orders/:id/proof', getDeliveryProof);
router.post('/orders/:id/proof', deliveryUpload.single('image'), uploadDeliveryProof);

export default router;
