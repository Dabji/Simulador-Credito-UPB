// ============================================================
// Singleton Pattern: Database Connection
// Garantiza una única instancia de conexión a MySQL usando
// Sequelize. Thread-safe mediante el patrón Singleton.
// ============================================================

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

export class Database {
  private static instance: Database | null = null;
  private readonly sequelize: Sequelize;

  private constructor() {
    this.sequelize = new Sequelize({
      dialect: 'mysql',
      host: process.env['DB_HOST'] ?? 'localhost',
      port: Number(process.env['DB_PORT'] ?? 3306),
      database: process.env['DB_NAME'] ?? 'simulador_credito_upb',
      username: process.env['DB_USER'] ?? 'root',
      password: process.env['DB_PASSWORD'] ?? '',
      logging: process.env['NODE_ENV'] === 'development' ? console.log : false,
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

  // ── Singleton accessor ──────────────────────────────────────
  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  // ── Public API ──────────────────────────────────────────────
  getSequelize(): Sequelize {
    return this.sequelize;
  }

  async connect(): Promise<void> {
    try {
      await this.sequelize.authenticate();
      console.log('✅ Conexión a MySQL establecida correctamente.');
    } catch (error) {
      console.error('❌ Error al conectar a MySQL:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.sequelize.close();
    Database.instance = null;
    console.log('🔌 Conexión a MySQL cerrada.');
  }

  async sync(force = false): Promise<void> {
    await this.sequelize.sync({ force });
    console.log('📦 Modelos sincronizados con la base de datos.');
  }
}
