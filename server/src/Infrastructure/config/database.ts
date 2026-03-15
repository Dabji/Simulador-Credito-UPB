// ============================================================
// Patrón Singleton: Conexión a Base de Datos
// Garantiza una única instancia de conexión a MySQL usando
// Sequelize. Consume las variables de entorno ya validadas.
// ============================================================

import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { env } from './env';

export class Database {
  private static instance: Database | null = null;
  private readonly sequelize: Sequelize;

  /**
   * Constructor privado — solo se invoca desde getInstance().
   * Configura Sequelize usando las variables validadas de `env`.
   */
  private constructor() {
    const useSSL = env.DB_SSL === 'true';

    // Leer certificado CA para conexiones SSL (Aiven Cloud)
    // SSL: usar certificado CA si existe, sino conectar con SSL sin verificación
    // (suficiente para desarrollo contra Aiven Cloud)
    const caPath = path.resolve(__dirname, '../../../certs/ca.pem');
    const hasCert = fs.existsSync(caPath);

    if (useSSL && !hasCert && env.NODE_ENV === 'production') {
      throw new Error(
        `SSL está habilitado (DB_SSL=true) pero no se encontró el certificado CA en ${caPath}. ` +
        'En producción es obligatorio proporcionar el certificado para evitar ataques MITM.',
      );
    }

    const dialectOptions = useSSL
      ? {
          ssl: hasCert
            ? { ca: fs.readFileSync(caPath, 'utf8'), rejectUnauthorized: true }
            : { rejectUnauthorized: false },
        }
      : undefined;

    this.sequelize = new Sequelize({
      dialect: 'mysql',
      host: env.DB_HOST,
      port: Number(env.DB_PORT),
      database: env.DB_NAME,
      username: env.DB_USER,
      password: env.DB_PASSWORD,
      logging: env.NODE_ENV === 'development' ? console.log : false,
      timezone: '-05:00', // America/Bogota (UTC-5)
      dialectOptions,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      define: {
        timestamps: true,
        underscored: true,
      },
    });
  }

  // ── Accessor Singleton ──────────────────────────────────────
  /** Retorna la instancia única de Database, creándola si no existe */
  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  // ── API Pública ─────────────────────────────────────────────

  /** Retorna la instancia de Sequelize subyacente */
  getSequelize(): Sequelize {
    return this.sequelize;
  }

  /** Autentica la conexión contra MySQL */
  async connect(): Promise<void> {
    try {
      await this.sequelize.authenticate();
      console.log('✅ Conexión a MySQL establecida correctamente.');
    } catch (error) {
      console.error('❌ Error al conectar a MySQL:', error);
      throw error;
    }
  }

  /** Cierra la conexión y destruye la instancia Singleton */
  async disconnect(): Promise<void> {
    await this.sequelize.close();
    Database.instance = null;
    console.log('🔌 Conexión a MySQL cerrada.');
  }

  /** Sincroniza los modelos Sequelize con la base de datos */
  async sync(force = false): Promise<void> {
    await this.sequelize.sync({ force });
    console.log('📦 Modelos sincronizados con la base de datos.');
  }
}
