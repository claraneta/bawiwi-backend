import { Router } from 'express';
import helloRoutes from './features/hello';
import authRoutes from './features/auth';

const router = Router();

router.use('/hello', helloRoutes);
router.use('/auth', authRoutes);

export default router;
