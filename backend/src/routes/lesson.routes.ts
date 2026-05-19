import { Router } from 'express';
import { getLessons, getLessonById, createLesson, updateLesson, deleteLesson, summarizeLesson, summarizeLessonPdf } from '../controllers/lesson.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import { safeController } from '../lib/controller-wrapper';

const router = Router();

router.get('/', authenticate, safeController('GetLessons', getLessons));
router.get('/:id', authenticate, safeController('GetLessonById', getLessonById));
router.post('/', authenticate, safeController('CreateLesson', createLesson));
router.put('/:id', authenticate, safeController('UpdateLesson', updateLesson));
router.patch('/:id', authenticate, safeController('PatchLesson', updateLesson));
router.delete('/:id', authenticate, safeController('DeleteLesson', deleteLesson));
router.post('/summarize', authenticate, safeController('SummarizeLesson', summarizeLesson));
router.post('/summarize-pdf', authenticate, upload.single('file'), safeController('SummarizeLessonPdf', summarizeLessonPdf));

export default router;
