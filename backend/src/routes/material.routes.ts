import { Router } from 'express';
import { generateMaterial, generatePPT } from '../controllers/material.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/generate', authenticate, generateMaterial);
router.post('/generate-ppt', authenticate, generatePPT);

export default router;
