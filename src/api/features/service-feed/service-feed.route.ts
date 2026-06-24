import { Router } from 'express';
import { authenticate, requireRole } from '../../shared/middleware/auth';
import { validate } from '../../shared/middleware/validate';
import { createFeed } from './service-feed.controller';
import { createServiceFeedSchema } from './service-feed.validator';
import { UserRole } from '../../../db/entities/user.entity';

const router = Router();

router.post(
  '/',
  authenticate,
  requireRole(UserRole.CLIENT),
  validate(createServiceFeedSchema),
  createFeed,
);

export default router;
