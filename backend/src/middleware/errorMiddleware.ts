import { Request, Response, NextFunction } from 'express';

export interface CustomError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[API ERROR] [${req.method}] ${req.path} - Status ${statusCode} - Message: ${message}`);
  if (configEnvDev()) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    stack: configEnvDev() ? err.stack : undefined,
  });
};

function configEnvDev(): boolean {
  return process.env.NODE_ENV !== 'production';
}
