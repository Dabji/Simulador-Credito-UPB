// ============================================================
// Middleware: Manejo Global de Errores
// Captura todos los errores no controlados y devuelve
// respuestas JSON estructuradas con tipado estricto.
//
// - AppError (isOperational): devuelve statusCode y message.
// - Error no operacional: registra con logger y devuelve 500
//   genérico para no filtrar detalles de implementación.
// ============================================================

import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../Core/errors/AppError';
import { logger } from '../../logger';
import { env } from '../../config/env';

/**
 * Estructura estándar de respuesta de error para toda la API.
 */
export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    statusCode: number;
    /** Solo presente en desarrollo para depuración */
    stack?: string;
  };
}

/**
 * Construye la respuesta de error estándar.
 */
function buildErrorResponse(
  message: string,
  statusCode: number,
  stack?: string,
): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    error: {
      message,
      statusCode,
    },
  };

  if (env.NODE_ENV === 'development' && stack) {
    response.error.stack = stack;
  }

  return response;
}

/**
 * Middleware de Express para capturar errores globales.
 *
 * - Si el error es una instancia de `AppError` (operacional),
 *   devuelve el `statusCode` y `message` correspondientes.
 * - Si es un error inesperado (no operacional), lo registra
 *   con el logger como error grave y devuelve un mensaje
 *   genérico HTTP 500 al cliente.
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // ── Error operacional (controlado / de negocio) ─────────
  if (err instanceof AppError && err.isOperational) {
    logger.warn(err.message, {
      statusCode: err.statusCode,
      method: req.method,
      path: req.originalUrl,
    });

    const response = buildErrorResponse(
      err.message,
      err.statusCode,
    );

    res.status(err.statusCode).json(response);
    return;
  }

  // ── Error no operacional (bug / inesperado) ─────────────
  logger.error('Error inesperado no controlado', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.originalUrl,
  });

  const response = buildErrorResponse(
    'Error interno del servidor',
    500,
    err instanceof Error ? err.stack : undefined,
  );

  res.status(500).json(response);
}
