import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../../db/entities/user.entity';
import { verifyToken } from '../../features/auth/auth.service';
import { unauthorized, forbidden } from '../../response-builder';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    unauthorized(res, 'Missing or invalid authorization header');
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    unauthorized(res, 'Invalid or expired token');
    return;
  }

  req.user = payload;
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorized(res);
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      forbidden(res, 'You do not have permission to perform this action');
      return;
    }

    next();
  };
}
