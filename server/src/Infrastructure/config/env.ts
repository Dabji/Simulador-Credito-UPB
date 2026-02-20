// ============================================================
// Environment Configuration
// Validación de variables de entorno con Zod.
// ============================================================

import { z } from 'zod';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const envSchema = z.object({
  // Server
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database (Aiven Cloud)
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('13557'),
  DB_NAME: z.string().default('defaultdb'),
  DB_USER: z.string().default('avnadmin'),
  DB_PASSWORD: z.string().default(''),
  DB_SSL: z.string().default('true'),

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
