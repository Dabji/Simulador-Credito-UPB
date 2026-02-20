// ============================================================
// Express Server Setup
// ============================================================

import express from 'express';
import cors from 'cors';
import { authRoutes, simulatorRoutes, adminRoutes } from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { authGuard } from './middlewares/authGuard';

export function createApp(): express.Application {
  const app = express();

  // ── Global Middlewares ────────────────────────────────────
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ── Health Check ──────────────────────────────────────────
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── Public Routes ─────────────────────────────────────────
  app.use('/api/auth', authRoutes);

  // ── Protected Routes ──────────────────────────────────────
  app.use('/api/simulator', authGuard, simulatorRoutes);
  app.use('/api/admin', authGuard, adminRoutes);

  // ── Error Handler (siempre al final) ──────────────────────
  app.use(errorHandler);

  return app;
}
