// ============================================================
// LDAP Authentication Service
// Implementa IAuthService para autenticar contra LDAP/AD.
// ============================================================

import * as ldap from 'ldapjs';
import type {
  IAuthService,
  LdapUserData,
} from '../../Application/use-cases/AuthenticateUserUseCase';
import { env } from '../config/env';
import { logger } from '../logger';
import { ServiceUnavailableError } from '../../Core/errors';

export class LdapAuthService implements IAuthService {
  async authenticate(
    username: string,
    password: string,
  ): Promise<LdapUserData | null> {
    // Validar configuración LDAP
    if (!env.LDAP_URL || !env.LDAP_DOMAIN || !env.LDAP_BASE_DN) {
      logger.warn('LDAP no configurado: faltan variables de entorno');
      throw new ServiceUnavailableError(
        'Servicio de autenticación no disponible',
        'LDAP_NOT_CONFIGURED',
      );
    }

    // Constantes locales seguras para TypeScript
    const ldapUrl = env.LDAP_URL!;
    const ldapDomain = env.LDAP_DOMAIN!;
    const ldapBaseDn = env.LDAP_BASE_DN!;
    const ldapTimeoutMs = env.LDAP_TIMEOUT_MS ?? 5000;

    // Construir UPN si el username no contiene @
    const upn = username.includes('@') ? username : `${username}@${ldapDomain}`;
    const usernameSinDominio = username.includes('@') ? username.split('@')[0] : username;

    logger.info(`[LDAP] Intentando autenticar: ${upn} contra ${ldapUrl}`);

    const client = ldap.createClient({
      url: ldapUrl,
      timeout: ldapTimeoutMs,
      connectTimeout: ldapTimeoutMs,
    });

    try {
      // Intentar bind directo con las credenciales del usuario
      await new Promise<void>((resolve, reject) => {
        client.bind(upn, password, (err) => {
          if (err) {
            if (err.name === 'InvalidCredentialsError') {
              logger.warn(`[LDAP] Credenciales inválidas para: ${upn}`);
              reject(new Error('INVALID_CREDENTIALS')); // Rechazar inmediatamente
            } else {
              logger.error(`[LDAP] Error de bind para ${upn}:`, err);
              reject(new ServiceUnavailableError(
                'Servicio de autenticación no disponible',
                'LDAP_BIND_ERROR',
              ));
            }
          } else {
            logger.info(`[LDAP] Bind exitoso para: ${upn}`);
            resolve();
          }
        });
      });

      // Solo si el bind fue exitoso, buscamos el usuario en el árbol configurado
      const searchResult = await new Promise<ldap.SearchEntry[]>((resolve, reject) => {
        const searchFilter = `(|(userPrincipalName=${upn})(mail=${upn})(sAMAccountName=${usernameSinDominio}))`;
        
        client.search(
          ldapBaseDn,
          {
            scope: 'sub',
            filter: searchFilter,
            attributes: ['userPrincipalName', 'mail', 'givenName', 'sn', 'employeeID'],
            sizeLimit: 1,
          },
          (err, res) => {
            if (err) {
              logger.error(`[LDAP] Error de búsqueda para ${upn}:`, err);
              reject(new ServiceUnavailableError(
                'Servicio de autenticación no disponible',
                'LDAP_SEARCH_ERROR',
              ));
              return;
            }

            const entries: ldap.SearchEntry[] = [];
            
            res.on('searchEntry', (entry) => {
              entries.push(entry);
            });

            res.on('error', (err) => {
              logger.error(`[LDAP] Error en búsqueda para ${upn}:`, err);
              reject(new ServiceUnavailableError(
                'Servicio de autenticación no disponible',
                'LDAP_SEARCH_ERROR',
              ));
            });

            res.on('end', () => {
              resolve(entries);
            });
          },
        );
      });

      // Si no encontramos el usuario en el árbol configurado, rechazamos
      if (searchResult.length === 0) {
        logger.warn(`[LDAP] Usuario ${upn} no encontrado en ${ldapBaseDn}`);
        return null;
      }

      const entry = searchResult[0];
      
      // Extraer atributos de forma segura con tipos ldapjs
      const attrs: Record<string, string> = {};
      if (entry.attributes) {
        for (const attr of entry.attributes) {
          if (attr.type && attr.vals && attr.vals.length > 0) {
            attrs[attr.type] = attr.vals[0] as string;
          }
        }
      }

      // Construir respuesta con datos disponibles del directorio
      const ldapUserData: LdapUserData = {
        email: attrs.mail || upn, // Usar UPN como fallback si no hay mail
        firstName: attrs.givenName || '',
        lastName: attrs.sn || '',
        identificationNumber: attrs.employeeID || '',
      };

      logger.info(`[LDAP] Usuario ${upn} autenticado y autorizado`);
      return ldapUserData;

    } catch (error) {
      // Si es credenciales inválidas, retornar null
      if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
        return null;
      }

      // Si ya es un ServiceUnavailableError, lo propagamos
      if (error instanceof ServiceUnavailableError) {
        throw error;
      }

      // Otros errores inesperados
      logger.error(`[LDAP] Error inesperado autenticando ${upn}:`, error);
      throw new ServiceUnavailableError(
        'Servicio de autenticación no disponible',
        'LDAP_UNKNOWN_ERROR',
      );
    } finally {
      // Asegurarnos de cerrar la conexión
      try {
        client.unbind();
      } catch (err) {
        logger.warn(`[LDAP] Error haciendo unbind:`, err);
      }
    }
  }
}
