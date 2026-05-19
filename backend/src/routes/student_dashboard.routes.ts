import { Router } from 'express';
import { getStudentDashboard, getStudentAssignments, submitAssignment } from '../controllers/student_dashboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard', getStudentDashboard);
router.get('/assignments', getStudentAssignments);
router.post('/assignments/submit', submitAssignment);

export default router;
