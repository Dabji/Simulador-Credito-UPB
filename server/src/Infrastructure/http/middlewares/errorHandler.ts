// ============================================================
// Middleware: Error Handler
// ============================================================

import type { Request, Response, NextFunction } from 'express';

export interface AppError {
  status: number;
  message: string;
}

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = 'status' in err ? err.status : 500;
  const message = err.message || 'Error interno del servidor';

  console.error(`[ERROR] ${status} - ${message}`);

  res.status(status).json({
    error: message,
    ...(process.env['NODE_ENV'] === 'development' && {
      stack: err instanceof Error ? err.stack : undefined,
    }),
  });
}
