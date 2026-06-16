import {
  Request,
  Response,
  NextFunction,
} from 'express';

export const requireRole =
  (roles: string[]) =>
  (
    req: any,
    res: Response,
    next: NextFunction
  ) => {

    if (
      !roles.includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        error: 'Access denied',
      });
    }

    next();
  };