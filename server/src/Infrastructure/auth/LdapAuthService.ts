// ============================================================
// LDAP Authentication Service
// Implementa IAuthService para autenticar contra LDAP/AD.
// Política final:
// - LDAP autentica credenciales
// - La BD local autoriza el rol ADMIN
// No se hace search LDAP posterior al bind.
// ============================================================
 
import * as ldap from 'ldapjs';
import type {
  IAuthService,
  LdapUserData,
} from '../../Application/use-cases/AuthenticateUserUseCase';
import { env } from '../config/env';
import { logger } from '../logger';
import { ServiceUnavailableError } from '../../Core/errors';
 
/**
 * Error sentinel para señalizar credenciales LDAP inválidas internamente.
 */
class LdapInvalidCredentialsError extends Error {
  constructor() {
    super('LDAP_INVALID_CREDENTIALS');
    this.name = 'LdapInvalidCredentialsError';
  }
}
 
export class LdapAuthService implements IAuthService {
  async authenticate(
    username: string,
    password: string,
  ): Promise<LdapUserData | null> {
    if (!env.LDAP_URL || !env.LDAP_DOMAIN) {
      logger.warn('LDAP no configurado: faltan variables de entorno');
      throw new ServiceUnavailableError(
        'Servicio de autenticación no disponible',
        'LDAP_NOT_CONFIGURED',
      );
    }
 
    const ldapUrl = env.LDAP_URL!;
    const ldapDomain = env.LDAP_DOMAIN!.trim().replace(/^"(.*)"$/, '$1');
    const ldapTimeoutMs = env.LDAP_TIMEOUT_MS ?? 5000;
 
    const upn = username.includes('@') ? username : `${username}@${ldapDomain}`;
 
    logger.info(`[LDAP] Intentando autenticar: ${upn} contra ${ldapUrl}`);
 
    const client = ldap.createClient({
      url: ldapUrl,
      timeout: ldapTimeoutMs,
      connectTimeout: ldapTimeoutMs,
    });
 
    try {
      await new Promise<void>((resolve, reject) => {
        client.bind(upn, password, (err) => {
          if (err) {
            if (err.name === 'InvalidCredentialsError') {
              logger.warn(`[LDAP] Credenciales inválidas para: ${upn}`);
              reject(new LdapInvalidCredentialsError());
              return;
            }
 
            logger.error(`[LDAP] Error de bind para ${upn}:`, err);
            reject(
              new ServiceUnavailableError(
                'Servicio de autenticación no disponible',
                'LDAP_BIND_ERROR',
              ),
            );
          } else {
            logger.info(`[LDAP] Bind exitoso para: ${upn}`);
            resolve();
          }
        });
      });
 
      const ldapUserData: LdapUserData = {
        email: upn,
        firstName: '',
        lastName: '',
        identificationNumber: '',
      };
 
      logger.info(`[LDAP] Usuario ${upn} autenticado correctamente por bind LDAP`);
      return ldapUserData;
    } catch (error) {
      if (error instanceof LdapInvalidCredentialsError) {
        return null;
      }
 
      if (error instanceof ServiceUnavailableError) {
        throw error;
      }
 
      logger.error(`[LDAP] Error inesperado autenticando ${upn}:`, error);
      throw new ServiceUnavailableError(
        'Servicio de autenticación no disponible',
        'LDAP_UNKNOWN_ERROR',
      );
    } finally {
      try {
        client.unbind();
      } catch (err) {
        logger.warn('[LDAP] Error haciendo unbind:', err);
      }
    }
  }
}
 