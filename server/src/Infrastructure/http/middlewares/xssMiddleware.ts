// ============================================================
// Middleware: Sanitización XSS recursiva (HU-53)
// Recorre recursivamente req.body, req.query y req.params
// y sanitiza todos los valores string con la librería `xss`.
// Reemplaza al paquete deprecado `xss-clean`.
// ============================================================

import type { Request, Response, NextFunction } from 'express';
import { FilterXSS } from 'xss';

const xssFilter = new FilterXSS({});

/**
 * Sanitiza recursivamente un valor:
 * - Strings → pasa por xss()
 * - Arrays  → sanitiza cada elemento
 * - Objects → sanitiza cada propiedad
 * - Otros tipos (number, boolean, null) → sin cambios
 */
function sanitize(value: unknown): unknown {
  if (typeof value === 'string') {
    return xssFilter.process(value);
  }

  if (Array.isArray(value)) {
    return value.map(sanitize);
  }

  if (value !== null && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      sanitized[key] = sanitize(val);
    }
    return sanitized;
  }

  return value;
}

/**
 * Middleware factory que sanitiza req.body, req.query y req.params
 * contra inyecciones XSS usando la librería `xss`.
 */
export function xssMiddleware() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.body) req.body = sanitize(req.body);
    if (req.query) req.query = sanitize(req.query) as typeof req.query;
    if (req.params) req.params = sanitize(req.params) as typeof req.params;
    next();
  };
}
