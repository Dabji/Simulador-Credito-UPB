// ============================================================
// Middleware: Manejo Global de Errores
// Captura todos los errores no controlados y devuelve
// respuestas JSON estructuradas con tipado estricto.
// ============================================================

import type { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env';

/**
 * Interfaz para errores de aplicación con código HTTP.
 * Permite distinguir errores de negocio de errores inesperados.
 */
export interface AppError {
  status: number;
  message: string;
}

/**
 * Estructura estándar de respuesta de error.
 */
export interface ErrorResponse {
  error: string;
  stack?: string;
}

/**
 * Middleware de Express para capturar errores globales.
 * - Errores con propiedad `status` se tratan como errores de negocio.
 * - Otros errores se devuelven con HTTP 500.
 * - En desarrollo se incluye el stack trace.
 */
export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = 'status' in err ? err.status : 500;
  const message = err.message || 'Error interno del servidor';

  console.error(`[ERROR] ${status} - ${message}`);

  const response: ErrorResponse = {
    error: message,
    ...(env.NODE_ENV === 'development' && {
      stack: err instanceof Error ? err.stack : undefined,
    }),
  };

  res.status(status).json(response);
}
