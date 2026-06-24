import { JwtPayload } from '../api/features/auth/auth.service';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
