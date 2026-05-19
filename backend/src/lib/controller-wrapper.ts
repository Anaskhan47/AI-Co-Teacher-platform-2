import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

export const safeController = (controllerName: string, fn: (req: AuthRequest, res: Response) => Promise<any>) => {
  return async (req: AuthRequest, res: Response) => {
    try {
      await fn(req, res);
    } catch (error: any) {
      console.error(`[${controllerName}] CRITICAL FAILURE:`, error);
      
      // Prevent double responses if headers are already sent
      if (res.headersSent) return;

      const isPrismaError = error.message?.includes('Prisma') || error.name === 'PrismaClientInitializationError';
      const statusCode = isPrismaError ? 503 : 500;
      
      res.status(statusCode).json({
        success: false,
        data: null,
        error: {
          code: isPrismaError ? 'DATABASE_UNAVAILABLE' : 'INTERNAL_ERROR',
          message: isPrismaError ? 'Database connection failed' : 'Internal server error',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
  };
};
