import { ExpressMiddlewareInterface } from 'routing-controllers';
import { Service } from 'typedi';
import { UserService } from '../services/UserService';
import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from 'routing-controllers';

@Service()
export class AuthMiddleware implements ExpressMiddlewareInterface {
  constructor(private userService: UserService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    console.log("AuthMiddleware use called")
    console.log("Cookies:", req.cookies)
    const token = req.cookies.sessionToken;
    console.log("*****************SESSION TOKEN*****************", token)

    if (!token) {
      throw new UnauthorizedError('No session token provided');
    }

    try {
      const user = await this.userService.validateSession(token);
      // Attach user to request for use in controllers
      (req as any).user = user;
      next();
    } catch (error) {
      console.log("error in auth middleware", error)
      
      // Only clear cookie for actual authentication failures, not temporary service issues
      if (error instanceof UnauthorizedError) {
        const isTemporaryError = error.message.includes('temporarily unavailable');
        
        if (!isTemporaryError) {
          // Clear invalid session cookie only for actual auth failures
          res.clearCookie('sessionToken');
        }
      }
      
      throw error;
    }
  }
}
