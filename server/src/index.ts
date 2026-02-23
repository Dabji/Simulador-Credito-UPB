// ============================================================
// Punto de entrada: Servidor
// Inicializa la base de datos, crea la app Express y
// levanta el servidor HTTP en el puerto configurado.
// ============================================================

import { createApp } from './Infrastructure/http/app';
import { Database } from './Infrastructure/config/database';
import { env } from './Infrastructure/config/env';

async function bootstrap(): Promise<void> {
  try {
    // 1. Intentar conectar a MySQL (Singleton)
    try {
      const db = Database.getInstance();
      await db.connect();

      // 2. Sincronizar modelos (en producción usar migraciones)
      if (env.NODE_ENV === 'development') {
        await db.sync(false);
      }
    } catch (dbError) {
      console.warn('⚠️  No se pudo conectar a MySQL. El servidor arrancará sin BD.');
      console.warn('   Detalle:', dbError instanceof Error ? dbError.message : dbError);
    }

    // 3. Iniciar servidor Express
    const app = createApp();
    const port = Number(env.PORT);

    app.listen(port, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
      console.log(`📋 Health check: http://localhost:${port}/api/health`);
      console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
      console.log(`🌍 Entorno: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

bootstrap();
