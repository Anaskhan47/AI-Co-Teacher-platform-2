import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as LessonV2 from '../controllers/lesson.v2.controller';

const router = Router();

// LESSON DOMAIN V2 - PRODUCTION ARCHITECTURE
router.get('/', authenticate, LessonV2.getAllLessons);
router.get('/:id', authenticate, LessonV2.getLessonById);
router.post('/', authenticate, LessonV2.createLesson);
router.patch('/:id', authenticate, LessonV2.updateLesson);
router.delete('/:id', authenticate, LessonV2.deleteLesson);

export default router;
