// ============================================================
// Configuracion de entorno
// Carga .env desde la raiz del monorepo y valida fail-fast con Zod.
// ============================================================

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

const ENV_PATH_CANDIDATES = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', '.env'),
];

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProduction = nodeEnv === 'production';
const envPath = ENV_PATH_CANDIDATES.find((candidate) => fs.existsSync(candidate));

if (envPath && !isProduction) {
  const dotenvResult = dotenv.config({ path: envPath });

  if (dotenvResult.error) {
    console.warn(`No se pudo cargar .env desde ${envPath}: ${dotenvResult.error.message}`);
  } else if (nodeEnv === 'development') {
    const count = Object.keys(dotenvResult.parsed ?? {}).length;
    console.log(`.env cargado desde ${envPath} (${count} variables)`);
  }
} else if (!isProduction && !envPath) {
  console.warn('No se encontró archivo .env. Se usarán variables del sistema si existen.');
}

const PLACEHOLDER_PATTERN = /(dummy|placeholder|change-in-production|your_|tu_|_aqui|here|password_temporal)/i;
const JWT_EXPIRES_IN_PATTERN = /^\d+(ms|s|m|h|d)$/;
const PORT_PATTERN = /^\d+$/;

function emptyToUndefined(value: unknown): unknown {
  return value === '' ? undefined : value;
}

function requiredString(name: string) {
  return z.preprocess(
    emptyToUndefined,
    z.string().trim().min(1, `${name} no puede estar vacia`),
  );
}

function optionalString() {
  return z.preprocess(
    emptyToUndefined,
    z.string().trim().min(1, 'No puede estar vacia').optional(),
  );
}

function requiredSecret(name: string, minLength = 1) {
  return z.preprocess(
    emptyToUndefined,
    z.string()
      .trim()
      .min(minLength, `${name} debe tener al menos ${minLength} caracteres`)
      .refine((value) => !PLACEHOLDER_PATTERN.test(value), {
        message: `${name} debe reemplazar el valor dummy por un secreto real`,
      }),
  );
}

function optionalSecret(name: string) {
  return z.preprocess(
    emptyToUndefined,
    z.string()
      .trim()
      .min(1, `${name} no puede estar vacia`)
      .refine((value) => !PLACEHOLDER_PATTERN.test(value), {
        message: `${name} debe reemplazar el valor dummy por un secreto real`,
      })
      .optional(),
  );
}

function portString(name: string) {
  return requiredString(name)
    .refine((value) => PORT_PATTERN.test(value), `${name} debe ser numerico`)
    .refine((value) => {
      const port = Number(value);
      return port >= 1 && port <= 65535;
    }, `${name} debe estar entre 1 y 65535`);
}

function optionalPortString(name: string) {
  return z.preprocess(
    emptyToUndefined,
    z.string()
      .trim()
      .regex(PORT_PATTERN, `${name} debe ser numerico`)
      .refine((value) => {
        const port = Number(value);
        return port >= 1 && port <= 65535;
      }, `${name} debe estar entre 1 y 65535`)
      .optional(),
  );
}

const baseEnvSchema = z.object({
  // Servidor
  PORT: portString('PORT').default('3000'),
  NODE_ENV: z.preprocess(
    emptyToUndefined,
    z.enum(['development', 'production', 'test']).default('development'),
  ),

  // Base de Datos MySQL (Aiven)
  DB_HOST: requiredString('DB_HOST'),
  DB_PORT: portString('DB_PORT'),
  DB_NAME: requiredString('DB_NAME'),
  DB_USER: requiredString('DB_USER'),
  DB_PASSWORD: requiredSecret('DB_PASSWORD'),
  DB_SSL: z.preprocess(emptyToUndefined, z.enum(['true', 'false']).default('true')),

  // LDAP / Active Directory
  LDAP_URL: z.preprocess(emptyToUndefined, z.string().trim().url().optional()),
  LDAP_DOMAIN: optionalString(),
  LDAP_BASE_DN: optionalString(),
  LDAP_BIND_DN: optionalString(),
  LDAP_BIND_PASSWORD: optionalSecret('LDAP_BIND_PASSWORD'),
  LDAP_TIMEOUT_MS: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(100).max(30000).default(5000),
  ),

  // JWT
  JWT_SECRET: requiredSecret('JWT_SECRET', 32),
  JWT_EXPIRES_IN: requiredString('JWT_EXPIRES_IN').refine(
    (value) => JWT_EXPIRES_IN_PATTERN.test(value),
    'JWT_EXPIRES_IN debe usar un formato como 15m, 8h o 7d',
  ),

  // Email / SMTP
  SMTP_HOST: optionalString(),
  SMTP_PORT: optionalPortString('SMTP_PORT'),
  SMTP_USER: optionalString(),
  SMTP_PASS: optionalSecret('SMTP_PASS'),
  SMTP_FROM_EMAIL: z.preprocess(emptyToUndefined, z.string().trim().email().optional()),
  FRONTEND_URL: z.preprocess(
    emptyToUndefined,
    z.string().trim().url().default('http://localhost:5173'),
  ),

  // Seed administrativo
  ADMIN_DEFAULT_PASSWORD: optionalSecret('ADMIN_DEFAULT_PASSWORD'),

  // Retencion / Purga automatica - simulations
  RETENTION_DAYS: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).default(90)),
  PURGE_INTERVAL_HOURS: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(1).max(596).default(24),
  ),
  PURGE_BATCH_SIZE: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1).max(10000).default(500),
  ),

  // Retencion / Purga automatica - password_reset_tokens
  TOKEN_PURGE_RETENTION_DAYS: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1).default(30),
  ),
  TOKEN_PURGE_INTERVAL_HOURS: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(1).max(596).default(24),
  ),
  TOKEN_PURGE_BATCH_SIZE: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1).max(10000).default(1000),
  ),
});

const envSchema = baseEnvSchema.superRefine((data, ctx) => {
  if (data.NODE_ENV !== 'production') {
    return;
  }

  const productionRequiredFields: Array<keyof z.infer<typeof baseEnvSchema>> = [
    'LDAP_URL',
    'LDAP_DOMAIN',
    'LDAP_BASE_DN',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'SMTP_FROM_EMAIL',
  ];

  for (const field of productionRequiredFields) {
    if (!data[field]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: `${field} es obligatoria en produccion`,
      });
    }
  }

  if (data.FRONTEND_URL.includes('localhost')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['FRONTEND_URL'],
      message: 'FRONTEND_URL no debe apuntar a localhost en produccion',
    });
  }

  if (data.DB_SSL !== 'true') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['DB_SSL'],
      message: 'DB_SSL debe ser true en produccion para MySQL Aiven',
    });
  }
});

export type EnvConfig = z.infer<typeof envSchema>;

function formatEnvErrors(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const key = issue.path.length > 0 ? issue.path.join('.') : 'ENV';
      const message =
        issue.code === 'invalid_type' && 'expected' in issue && issue.expected === 'string'
          ? `${key} es obligatoria`
          : issue.message;
      return `- ${key}: ${message}`;
    })
    .join('\n');
}

function validateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Variables de entorno inválidas:');
    console.error(formatEnvErrors(result.error));
    process.exit(1);
  }

  return result.data;
}

export const env: EnvConfig = validateEnv();
