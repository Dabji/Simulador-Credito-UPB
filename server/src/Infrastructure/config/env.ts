// ============================================================
// Configuración de Entorno
// Validación estricta de variables de entorno con Zod v4.
// Todas las variables se exportan tipadas para consumo seguro
// en el resto de la aplicación.
// ============================================================

import { z } from 'zod';
import path from 'path';
import dotenv from 'dotenv';

// Cargar .env desde la raíz del monorepo
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

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
  JWT_EXPIRES_IN: z.string().default('8h'),
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
    console.error(JSON.stringify(result.error.issues, null, 2));
    process.exit(1);
  }

  return result.data;
}

/** Variables de entorno validadas y tipadas */
export const env: EnvConfig = validateEnv();
