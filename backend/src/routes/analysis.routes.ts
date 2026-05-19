
import express from 'express';
import { analyzeData } from '../controllers/analysis.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/analyze-data', authenticate, analyzeData);

export default router;
