import { Router } from 'express';
import { generateExamPaper } from '../controllers/exam.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/generate', authenticate, generateExamPaper);

export default router;
