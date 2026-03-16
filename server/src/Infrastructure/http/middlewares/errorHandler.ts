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
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../../../Core/errors';
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
    /** Código semántico del error (HU-04) */
    errorCode?: string;
    /** Solo presente en desarrollo para depuración */
    stack?: string;
    /** Errores por campo (solo para ValidationError, HU-02) */
    fieldErrors?: Record<string, string[]>;
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
  // ── Error de validación Zod (HU-53) ─────────────────────
  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const field = issue.path.join('.') || '_form';
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }

    logger.warn('Validación Zod fallida', {
      method: req.method,
      path: req.originalUrl,
      fieldErrors,
    });

    const response: ErrorResponse = {
      success: false,
      error: {
        message: 'Los datos enviados no son válidos.',
        statusCode: 400,
        errorCode: 'VALIDATION_ERROR',
        fieldErrors,
      },
    };

    res.status(400).json(response);
    return;
  }

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

    // Incluir errorCode semántico si existe (HU-04)
    if (err.errorCode) {
      response.error.errorCode = err.errorCode;
    }

    // Si es un ValidationError, incluir errores por campo (HU-02)
    if (err instanceof ValidationError) {
      response.error.fieldErrors = err.fieldErrors;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // ── Error no operacional (bug / inesperado) ─────────────
  logger.error('Error inesperado no controlado', {
    message: err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    method: req.method,
    path: req.originalUrl,
  });

  const response = buildErrorResponse(
    'Ocurrió un error inesperado. Intenta de nuevo más tarde.',
    500,
    err instanceof Error ? err.stack : undefined,
  );
  response.error.errorCode = 'SERVER_ERROR';

  res.status(500).json(response);
}
