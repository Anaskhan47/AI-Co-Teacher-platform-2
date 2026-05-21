import { Router } from 'express';
import { uploadFile, extractPdfText } from '../controllers/upload.controller.js';
import { upload } from '../middleware/upload.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Only authenticated users can upload files
router.post('/', authenticate, upload.single('file') as any, uploadFile);
router.post('/pdf', authenticate, upload.single('file') as any, extractPdfText);

export default router;
