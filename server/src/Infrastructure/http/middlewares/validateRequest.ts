// ============================================================
// Middleware: Validación Universal con Zod (HU-53)
// Recibe un esquema Zod y valida body, query y params.
// Si la validación pasa, muta req con los datos transformados
// (e.g. trim, toLowerCase). Si falla, delega al errorHandler.
// ============================================================

import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';

/** Forma esperada del resultado de parseo a nivel de request. */
type RequestShape = {
  body?: unknown;
  query?: unknown;
  params?: unknown;
};

/** Esquema Zod que valida un objeto con las claves body, query y/o params. */
type RequestSchema = ZodType<RequestShape>;

/**
 * Middleware factory que valida la request contra un esquema Zod.
 *
 * @param schema - Esquema Zod que espera un objeto con `body`, `query` y/o `params`.
 * @returns Middleware de Express que valida y transforma la request.
 *
 * @example
 * ```ts
 * const MySchema = z.object({
 *   body: z.object({ email: z.string().trim().email() }),
 * });
 * router.post('/endpoint', validateRequest(MySchema), handler);
 * ```
 */
export function validateRequest(schema: RequestSchema) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Mutar la request con los datos validados/transformados por Zod.
      // En Express 5, req.query y req.params son getters de solo lectura,
      // por lo que se mutan in-place en lugar de reasignar.
      if (result.body !== undefined) req.body = result.body;
      if (result.query !== undefined) Object.assign(req.query, result.query);
      if (result.params !== undefined) Object.assign(req.params, result.params);

      next();
    } catch (error) {
      next(error);
    }
  };
}
