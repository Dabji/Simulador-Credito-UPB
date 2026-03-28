// ============================================================
// Punto de entrada: Servidor
// Inicializa la base de datos, crea la app Express y
// levanta el servidor HTTP en el puerto configurado.
// ============================================================

import { createApp } from './Infrastructure/http/app';
import { Database } from './Infrastructure/config/database';
import { env } from './Infrastructure/config/env';
import { logger } from './Infrastructure/logger';
import { startPurgeScheduler } from './Infrastructure/scheduler/SimulationPurgeJob';

async function bootstrap(): Promise<void> {
  try {
    // 1. Intentar conectar a MySQL (Singleton)
    try {
      const db = Database.getInstance();
      await db.connect();
      logger.info('Conexión a MySQL establecida correctamente');

      // 2. Iniciar scheduler de purga automática (configurable vía RETENTION_DAYS)
      startPurgeScheduler();

      // 3. Sincronizar modelos (en producción usar migraciones)
      if (env.NODE_ENV === 'development') {
        await db.sync(false);
        logger.info('Modelos sincronizados (modo desarrollo)');
      }
    } catch (dbError) {
      logger.warn('No se pudo conectar a MySQL. El servidor arrancará sin BD.', {
        detail: dbError instanceof Error ? dbError.message : JSON.stringify(dbError),
      });
    }

    // 3. Iniciar servidor Express
    const app = createApp();
    const port = Number(env.PORT);

    app.listen(port, () => {
      logger.info(`Servidor corriendo en http://localhost:${port}`, {
        port,
        environment: env.NODE_ENV,
        healthCheck: `http://localhost:${port}/api/health`,
        swagger: `http://localhost:${port}/api/docs`,
      });
    });
  } catch (error) {
    logger.error('Error fatal al iniciar el servidor', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

bootstrap();
