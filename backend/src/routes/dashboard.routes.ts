import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { safeController } from '../lib/controller-wrapper.js';

const router = Router();

router.get('/stats', authenticate, safeController('DashboardStats', getDashboardStats));

export default router;
