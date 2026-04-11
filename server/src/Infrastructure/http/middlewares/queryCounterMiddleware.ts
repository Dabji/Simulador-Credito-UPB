// ============================================================
// Middleware: queryCounterMiddleware
// Inicia un AsyncLocalStorage context por request HTTP.
// Al finalizar el request logea: método, ruta, tiempo total
// y número de queries ejecutadas en esa petición.
// Solo activo en desarrollo (NODE_ENV === 'development').
// ============================================================

import type { Request, Response, NextFunction } from 'express';
import { queryContext } from '../../config/queryContext';

export function queryCounterMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (process.env.NODE_ENV !== 'development') {
    next();
    return;
  }

  const ctx = {
    count: 0,
    method: req.method,
    path: req.path,
    startMs: Date.now(),
  };

  queryContext.run(ctx, () => {
    res.on('finish', () => {
      const elapsed = Date.now() - ctx.startMs;
      const status = res.statusCode;
      const color = ctx.count >= 5 ? '🔴' : ctx.count >= 3 ? '🟡' : '🟢';
      console.log(
        `${color} [QUERIES] ${ctx.method} ${ctx.path} → ${status} | ${ctx.count} queries | ${elapsed}ms`,
      );
    });
    next();
  });
}
