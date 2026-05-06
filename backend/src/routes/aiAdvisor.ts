import express from 'express';
import { getAIAdvice } from '../controllers/aiAdvisorController';

const router = express.Router();

router.post('/chat', getAIAdvice);

export default router;
