// ============================================================
// Logger Profesional con Winston
// Registra eventos en consola (con colores) y en archivo .log.
// SEGURIDAD: Campos sensibles se redactan automáticamente.
// ============================================================

import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';

// ── Campos sensibles que se deben redactar ──────────────────
const SENSITIVE_KEYS: ReadonlySet<string> = new Set([
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'secret',
  'ldap_bind_password',
  'jwt_secret',
  'cookie',
  'creditcard',
  'ssn',
]);

const REDACTED = '[REDACTED]';

/**
 * Regex que detecta valores sensibles embebidos en strings
 * (ej.: "password=abc123" o "token: xyz").
 */
const SENSITIVE_PATTERN = new RegExp(
  `(${[...SENSITIVE_KEYS].join('|')})[\\s]*[=:][\\s]*[^\\s,;]+`,
  'gi',
);

/**
 * Censura valores sensibles que aparezcan dentro de un string.
 */
function redactSensitiveString(str: string): string {
  return str.replace(SENSITIVE_PATTERN, (match) => {
    const sep = match.includes('=') ? '=' : ':';
    const key = match.slice(0, match.indexOf(sep)).trim();
    return `${key}${sep}${REDACTED}`;
  });
}

/**
 * Redacta recursivamente valores de campos sensibles en un objeto.
 * Opera sobre una copia para no mutar el original.
 */
function redactSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') return redactSensitiveString(data);

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item));
  }

  if (typeof data === 'object') {
    const redacted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        redacted[key] = REDACTED;
      } else {
        redacted[key] = redactSensitiveData(value);
      }
    }
    return redacted;
  }

  return data;
}

/**
 * Formato personalizado que redacta datos sensibles antes de serializar.
 */
const redactFormat = winston.format((info) => {
  // Redactar valores sensibles dentro del mensaje
  if (typeof info.message === 'string') {
    info.message = redactSensitiveString(info.message);
  }

  if (info.metadata && typeof info.metadata === 'object') {
    info.metadata = redactSensitiveData(info.metadata);
  }

  // Redactar claves de nivel superior (excluyendo campos estándar de Winston)
  const STANDARD_KEYS = new Set(['level', 'message', 'timestamp']);
  for (const key of Object.keys(info)) {
    if (!STANDARD_KEYS.has(key) && typeof info[key] === 'object' && info[key] !== null) {
      (info as Record<string, unknown>)[key] = redactSensitiveData(info[key]);
    }
  }

  return info;
});

// ── Formato para consola (colores en desarrollo) ────────────
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
  redactFormat(),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, metadata }) => {
    const meta = metadata && Object.keys(metadata as Record<string, unknown>).length > 0
      ? ` ${JSON.stringify(metadata)}`
      : '';
    return `[${timestamp as string}] ${level}: ${message as string}${meta}`;
  }),
);

// ── Formato para archivo (JSON estructurado) ────────────────
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
  redactFormat(),
  winston.format.json(),
);

// ── Directorio de logs ──────────────────────────────────────
const LOG_DIR = path.resolve(process.cwd(), 'logs');
fs.mkdirSync(LOG_DIR, { recursive: true });

// ── Transportes ─────────────────────────────────────────────
const transports: winston.transport[] = [
  // Consola: siempre activa
  new winston.transports.Console({
    format: consoleFormat,
    level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  }),

  // Archivo: errores
  new winston.transports.File({
    filename: path.join(LOG_DIR, 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5 * 1024 * 1024, // 5 MB
    maxFiles: 5,
  }),

  // Archivo: todos los logs
  new winston.transports.File({
    filename: path.join(LOG_DIR, 'combined.log'),
    format: fileFormat,
    maxsize: 10 * 1024 * 1024, // 10 MB
    maxFiles: 5,
  }),
];

// ── Instancia del Logger ────────────────────────────────────
export const logger = winston.createLogger({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  defaultMeta: { service: 'simulador-credito-upb' },
  transports,
  // No cerrar en rejections/exceptions para poder loguear antes de salir
  exitOnError: false,
});

/**
 * Maneja excepciones y rejections no capturados.
 * Winston los registra y el proceso decide si salir.
 */
logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join(LOG_DIR, 'exceptions.log'),
    format: fileFormat,
  }),
);

logger.rejections.handle(
  new winston.transports.File({
    filename: path.join(LOG_DIR, 'rejections.log'),
    format: fileFormat,
  }),
);
