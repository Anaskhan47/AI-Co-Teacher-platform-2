import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';
import { safeController } from '../lib/controller-wrapper';

const router = Router();

router.get('/stats', authenticate, safeController('DashboardStats', getDashboardStats));

export default router;
