import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader =
      req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'No token provided',
      });
    }

    const token =
      authHeader.split(' ')[1];

    const decoded: any =
      jwt.verify(
        token,
        process.env.JWT_SECRET!
      );

    req.user = decoded;
    req.userId =
      decoded.userId;

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid token',
    });
  }
};