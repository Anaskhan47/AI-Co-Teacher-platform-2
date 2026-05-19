import { Router } from 'express';
import { getParentDashboard } from '../controllers/parent_dashboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/data', authenticate, getParentDashboard);

export default router;
