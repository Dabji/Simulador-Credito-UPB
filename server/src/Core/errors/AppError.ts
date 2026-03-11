// ============================================================
// Clase Base: AppError
// Error de aplicación con código HTTP y bandera operacional.
// Los errores operacionales (isOperational = true) son errores
// predecibles del negocio. Los no operacionales son bugs.
// ============================================================

/**
 * Clase base para errores controlados de la aplicación.
 * Extiende `Error` nativo e incluye metadatos HTTP.
 *
 * @example
 * ```ts
 * throw new AppError('Recurso no encontrado', 404);
 * throw new AppError('Credenciales inválidas', 401);
 * ```
 */
export class AppError extends Error {
  /** Código de estado HTTP asociado al error */
  public readonly statusCode: number;

  /**
   * Indica si el error es operacional (esperado) o un bug.
   * - `true`: Error de negocio controlado (ej.: validación, 404).
   * - `false`: Error inesperado / bug en el sistema.
   */
  public readonly isOperational: boolean;

  /** Código de error semántico para que el frontend distinga tipos de error (HU-04) */
  public readonly errorCode?: string;

  constructor(message: string, statusCode: number, isOperational = true, errorCode?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;

    // Mantener el prototype chain correcto para instanceof
    Object.setPrototypeOf(this, new.target.prototype);

    // Capturar stack trace limpio (excluye el constructor)
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Errores HTTP comunes preconfigurados para uso rápido.
 */
export class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} no encontrado`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado', errorCode?: string) {
    super(message, 401, true, errorCode);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acceso denegado') {
    super(message, 403);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Solicitud inválida') {
    super(message, 400);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflicto con el estado actual del recurso') {
    super(message, 409);
  }
}

export class ValidationError extends AppError {
  public readonly fieldErrors: Record<string, string[]>;
  constructor(message: string, fieldErrors: Record<string, string[]>) {
    super(message, 400);
    this.fieldErrors = fieldErrors;
  }
}
