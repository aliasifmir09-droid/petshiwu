import express from 'express';
import {
  getEmailTemplates,
  getEmailTemplate,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  seedTemplates
} from '../controllers/emailTemplateController';
import { protect } from '../middleware/auth';
import { isAdmin } from '../middleware/permissions';
import { validateObjectId } from '../middleware/validation';

const router = express.Router();

// Email template routes (admin only)
router.get('/', protect, isAdmin, getEmailTemplates);
router.get('/:id', protect, isAdmin, validateObjectId(), getEmailTemplate);
router.post('/', protect, isAdmin, createEmailTemplate);
router.put('/:id', protect, isAdmin, validateObjectId(), updateEmailTemplate);
router.delete('/:id', protect, isAdmin, validateObjectId(), deleteEmailTemplate);
router.post('/seed', protect, isAdmin, seedTemplates);

export default router;

