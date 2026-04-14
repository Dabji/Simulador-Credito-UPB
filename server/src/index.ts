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
import { startTokenPurgeScheduler } from './Infrastructure/scheduler/PasswordResetTokenPurgeJob';
import { updateDocumentTypesMigration } from './Infrastructure/persistence/migrations/updateDocumentTypes';

async function bootstrap(): Promise<void> {
  try {
    // 1. Intentar conectar a MySQL (Singleton)
    try {
      const db = Database.getInstance();
      await db.connect();
      logger.info('Conexión a MySQL establecida correctamente');

      // 1.5 Ejecutar migraciones
      try {
        await updateDocumentTypesMigration();
        logger.info('Migraciones ejecutadas correctamente');
      } catch (migrationError) {
        logger.warn('Error ejecutando migraciones (puede ser normal si ya están aplicadas)', {
          detail: migrationError instanceof Error ? migrationError.message : String(migrationError),
        });
      }

      // 2. Iniciar schedulers de purga automática
      startPurgeScheduler();         // simulations — arranca a los 30s
      startTokenPurgeScheduler();    // password_reset_tokens — arranca a los 60s

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
