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
import { authGuard }   from './middlewares/authGuard';
import { adminGuard }  from './middlewares/adminGuard';
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

  // ── Documentación Swagger ─────────────────────────────────
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // ── Health Check ──────────────────────────────────────────
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── Rutas Públicas ────────────────────────────────────────
  app.use('/api/auth', authRoutes);

  // API: endpoints públicos temporales HU-13 (sin auth, sin DB)
  // Se montan ANTES del authGuard para que /preview y /save sean accesibles.
  app.use('/api/simulator', simulatorPublicRoutes);

  // ── Rutas Protegidas ──────────────────────────────────────
  app.use('/api/simulator', authGuard, simulatorRoutes);
  // /api/admin: requiere JWT válido (authGuard) + role === "admin" (adminGuard → 403 si no)
  app.use('/api/admin', authGuard, adminGuard, adminRoutes);

  // ── Manejador de Errores (siempre al final) ───────────────
  app.use(errorHandler);

  return app;
}
