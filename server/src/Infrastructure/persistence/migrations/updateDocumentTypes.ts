// ============================================================
// Migración: Actualizar tipos de documento en la base de datos
// Issue #187: Agregar soporte para 9 tipos de documento
// ============================================================

import { Database } from '../../config/database';

/**
 * Actualiza el ENUM de document_type para incluir todos los tipos soportados:
 * CC, CE, DE, PA, PE, PT, RC, TI, VI
 */
export async function updateDocumentTypesMigration(): Promise<void> {
  const db = Database.getInstance();
  const sequelize = db.getSequelize();

  try {
    console.log('🔄 Iniciando migración de tipos de documento...');

    // Verificar la estructura actual de la tabla
    const [results] = await sequelize.query(`
      SHOW COLUMNS FROM users WHERE Field = 'document_type'
    `);

    console.log('📋 Estructura actual de document_type:', results);

    // Actualizar el ENUM para incluir todos los tipos de documento
    // MySQL requiere recrear el ENUM para agregar valores
    await sequelize.query(`
      ALTER TABLE users 
      MODIFY COLUMN document_type ENUM('CC', 'CE', 'DE', 'PA', 'PE', 'PT', 'RC', 'TI', 'VI') NULL
    `);

    console.log('✅ Migración completada: Tipos de documento actualizados');
    console.log('📋 Nuevos tipos soportados: CC, CE, DE, PA, PE, PT, RC, TI, VI');

  } catch (error) {
    console.error('❌ Error en la migración:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  (async () => {
    try {
      const db = Database.getInstance();
      await db.connect();
      await updateDocumentTypesMigration();
      await db.disconnect();
      process.exit(0);
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  })();
}
