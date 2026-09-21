import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

router.use('/auth', authRoutes);

// FUTURE: router.use('/dashboard', dashboardRoutes);

export default router;
