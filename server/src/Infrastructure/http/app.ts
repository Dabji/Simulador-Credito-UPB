// ============================================================
// Configuración del Servidor Express
// Middlewares globales, documentación Swagger, rutas y
// manejo de errores.
// ============================================================

import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { authRoutes, simulatorRoutes, adminRoutes } from './routes';
import simulatorPublicRoutes from './routes/simulatorPublicRoutes';
import { errorHandler } from './middlewares/errorHandler';
import { authGuard } from './middlewares/authGuard';
import { roleGuard } from './middlewares/roleGuard';
import { UserRole } from '../../Core/entities/User';
import { swaggerDocument } from './swagger';

/**
 * Crea y configura la aplicación Express.
 * Registra middlewares, rutas públicas/protegidas,
 * documentación Swagger y el manejador de errores global.
 */
export function createApp(): express.Application {
  const app = express();

  // ── Middlewares Globales ───────────────────────────────────
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Evitar que el navegador cachee respuestas autenticadas (HU-05).
  // Esto impide que al presionar "atrás" después de cerrar sesión
  // se muestre contenido cacheado de la API.
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
  });

  // ── Documentación Swagger ─────────────────────────────────
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // ── Health Check ──────────────────────────────────────────
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── Rutas Públicas ────────────────────────────────────────
  app.use('/api/auth', authRoutes);

  // API: endpoints públicos temporales HU-13 (sin auth, sin DB)
  // Solo `/preview` es público. Se monta ANTES del authGuard.
  app.use('/api/simulator', simulatorPublicRoutes);

  // ── Rutas Protegidas ──────────────────────────────────────
  // Rutas protegidas por rol (HU-07)
  app.use('/api/simulator', authGuard, simulatorRoutes);
  app.use('/api/admin', authGuard, roleGuard(UserRole.ADMIN), adminRoutes);

  // ── Manejador de Errores (siempre al final) ───────────────
  app.use(errorHandler);

  return app;
}
