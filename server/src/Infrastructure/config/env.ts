// ============================================================
// Configuración de Entorno
// Validación estricta de variables de entorno con Zod v4.
// Todas las variables se exportan tipadas para consumo seguro
// en el resto de la aplicación.
// ============================================================

import { z } from 'zod';
import path from 'path';
import dotenv from 'dotenv';

// Cargar .env desde la raíz del monorepo.
// process.cwd() apunta a server/ cuando se ejecuta npm run dev,
// por eso subimos un nivel (../) para llegar a Simulador-Credito-UPB/.env
const envPath = path.resolve(process.cwd(), '..', '.env');
const dotenvResult = dotenv.config({ path: envPath });

if (process.env.NODE_ENV === 'development') {
  if (dotenvResult.error) {
    console.warn(`⚠️  No se pudo cargar .env desde ${envPath}:`, dotenvResult.error.message);
  } else {
    const count = Object.keys(dotenvResult.parsed ?? {}).length;
    console.log(`✅ .env cargado desde ${envPath} (${count} variables)`);
  }
}

/**
 * Esquema de validación para las variables de entorno.
 * Cada variable tiene un valor por defecto (desarrollo local)
 * o se marca como opcional según corresponda.
 */
const envSchema = z.object({
  // ── Servidor ────────────────────────────────────────────
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // ── Base de Datos MySQL (Aiven Cloud) ───────────────────
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('13557'),
  DB_NAME: z.string().default('defaultdb'),
  DB_USER: z.string().default('avnadmin'),
  DB_PASSWORD: z.string().default(''),
  DB_SSL: z.string().default('true'),

  // ── LDAP / Active Directory ─────────────────────────────
  LDAP_URL: z.string().url().optional(),
  LDAP_BIND_DN: z.string().optional(),
  LDAP_BIND_PASSWORD: z.string().optional(),
  LDAP_SEARCH_BASE: z.string().optional(),

  // ── JWT ─────────────────────────────────────────────────
  JWT_SECRET: z.string().default('dev-secret-change-in-production'),
  JWT_EXPIRES_IN: z.string().default('24h'),
});

/** Tipo inferido del esquema de entorno — utilizado en toda la app */
export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Valida las variables de entorno contra el esquema Zod.
 * Si falla, imprime los errores y detiene el proceso.
 */
function validateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Variables de entorno inválidas:');
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
}

/** Variables de entorno validadas y tipadas */
export const env: EnvConfig = validateEnv();
