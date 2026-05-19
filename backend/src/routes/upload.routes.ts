import { Router } from 'express';
import { uploadFile, extractPdfText } from '../controllers/upload.controller.js';
import { upload } from '../middleware/upload.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Only authenticated users can upload files
router.post('/', authenticate, upload.single('file'), uploadFile);
router.post('/pdf', authenticate, upload.single('file'), extractPdfText);

export default router;
