import { Router } from 'express';
import helloRoutes from './features/hello';
import authRoutes from './features/auth/auth.route';
import serviceFeedRoutes from './features/service-feed/service-feed.route';

const router = Router();

router.use('/hello', helloRoutes);
router.use('/auth', authRoutes);
router.use('/service-feeds', serviceFeedRoutes);

export default router;
