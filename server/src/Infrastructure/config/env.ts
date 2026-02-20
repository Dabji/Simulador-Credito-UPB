// ============================================================
// Environment Configuration
// Validación de variables de entorno con Zod.
// ============================================================

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Server
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('3306'),
  DB_NAME: z.string().default('simulador_credito_upb'),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default(''),

  // LDAP
  LDAP_URL: z.string().url().optional(),
  LDAP_BIND_DN: z.string().optional(),
  LDAP_BIND_PASSWORD: z.string().optional(),
  LDAP_SEARCH_BASE: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().default('dev-secret-change-in-production'),
  JWT_EXPIRES_IN: z.string().default('8h'),
});

export type EnvConfig = z.infer<typeof envSchema>;

function validateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Variables de entorno inválidas:');
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
}

export const env: EnvConfig = validateEnv();
