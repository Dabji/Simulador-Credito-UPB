// ============================================================
// Middleware: Validación Universal con Zod (HU-53)
// Recibe un esquema Zod y valida body, query y params.
// Si la validación pasa, muta req con los datos transformados
// (e.g. trim, toLowerCase). Si falla, delega al errorHandler.
// ============================================================

import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';

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
export function validateRequest(schema: ZodType) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as { body?: unknown; query?: unknown; params?: unknown };

      // Mutar la request con los datos validados/transformados por Zod
      if (result.body !== undefined) req.body = result.body;
      if (result.query !== undefined) req.query = result.query as typeof req.query;
      if (result.params !== undefined) req.params = result.params as typeof req.params;

      next();
    } catch (error) {
      next(error);
    }
  };
}
