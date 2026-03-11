// ============================================================
// Middleware: Rate Limiting
// Protege endpoints sensibles contra ataques de fuerza bruta
// y abuso. Configura límites diferenciados por tipo de ruta.
// ============================================================

import rateLimit from 'express-rate-limit';

/**
 * Limita los intentos de autenticación (login, forgot-password, reset-password).
 * 10 solicitudes por ventana de 15 minutos por IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Demasiados intentos. Intente de nuevo en 15 minutos.',
      statusCode: 429,
    },
  },
});

/**
 * Limita las solicitudes de simulación (preview público).
 * 30 solicitudes por ventana de 1 minuto por IP.
 */
export const simulatorLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Demasiadas solicitudes de simulación. Intente de nuevo en 1 minuto.',
      statusCode: 429,
    },
  },
});
