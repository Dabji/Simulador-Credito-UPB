// ============================================================
// Migracion: Actualizar tipos de documento en la base de datos
// Issue #187: Agregar soporte para 9 tipos de documento
// ============================================================

import { Database } from '../../config/database';

const DOCUMENT_TYPE_ENUM_SQL = "ENUM('CC', 'CE', 'DE', 'PA', 'PE', 'PT', 'RC', 'TI', 'VI')";

/**
 * Actualiza el ENUM de document_type para incluir todos los tipos soportados:
 * CC, CE, DE, PA, PE, PT, RC, TI, VI.
 *
 * La base de datos ya debe estar saneada sin valores nulos antes de ejecutar
 * esta migracion. Aqui solo se alinea el esquema con el modelo del backend.
 */
export async function updateDocumentTypesMigration(): Promise<void> {
  const db = Database.getInstance();
  const sequelize = db.getSequelize();

  try {
    console.log('Iniciando migracion de tipos de documento...');

    const [results] = await sequelize.query(`
      SHOW COLUMNS FROM users WHERE Field = 'document_type'
    `);

    console.log('Estructura actual de document_type:', results);

    await sequelize.query(`
      ALTER TABLE users
      MODIFY COLUMN document_type ${DOCUMENT_TYPE_ENUM_SQL} NOT NULL
    `);

    console.log('Migracion completada: Tipos de documento actualizados');
    console.log('Nuevos tipos soportados: CC, CE, DE, PA, PE, PT, RC, TI, VI');
  } catch (error) {
    console.error('Error en la migracion:', error);
    throw error;
  }
}

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
