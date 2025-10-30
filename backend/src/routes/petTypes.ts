import express from 'express';
import {
  getPetTypes,
  getAllPetTypesAdmin,
  getPetType,
  createPetType,
  updatePetType,
  deletePetType,
  reorderPetTypes
} from '../controllers/petTypeController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Admin routes (must come before /:slug to avoid conflicts)
router.get('/admin/all', protect, authorize('admin', 'staff'), getAllPetTypesAdmin);
router.post('/reorder', protect, authorize('admin'), reorderPetTypes);

// Public routes
router.get('/', getPetTypes);
router.get('/:slug', getPetType);

// CRUD routes
router.post('/', protect, authorize('admin'), createPetType);
router.put('/:id', protect, authorize('admin'), updatePetType);
router.delete('/:id', protect, authorize('admin'), deletePetType);

export default router;

