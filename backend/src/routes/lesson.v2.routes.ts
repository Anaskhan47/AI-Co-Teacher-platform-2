import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as LessonV2 from '../controllers/lesson.v2.controller';
import { safeController } from '../lib/controller-wrapper';

const router = Router();

// LESSON DOMAIN V2 - PRODUCTION ARCHITECTURE
router.get('/', authenticate, safeController('GetAllLessons', LessonV2.getAllLessons));
router.get('/:id', authenticate, safeController('GetLessonById', LessonV2.getLessonById));
router.post('/', authenticate, safeController('CreateLesson', LessonV2.createLesson));
router.patch('/:id', authenticate, safeController('UpdateLesson', LessonV2.updateLesson));
router.delete('/:id', authenticate, safeController('DeleteLesson', LessonV2.deleteLesson));

export default router;
