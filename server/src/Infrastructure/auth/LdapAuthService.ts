// ============================================================
// LDAP Authentication Service
// Implementa IAuthService para autenticar contra LDAP/AD.
// ============================================================

import type {
  IAuthService,
  LdapUserData,
} from '../../Application/use-cases/AuthenticateUserUseCase';
import { env } from '../config/env';

export class LdapAuthService implements IAuthService {
  async authenticate(
    username: string,
    _password: string,
  ): Promise<LdapUserData | null> {
    // TODO: Implementar autenticación real con passport-ldapauth
    // Por ahora, stub para desarrollo:
    console.log(
      `[LDAP] Intentando autenticar: ${username} contra ${env.LDAP_URL ?? 'N/A'}`,
    );

    // En producción, aquí se usaría passport-ldapauth o ldapjs
    // para autenticar contra el AD de la UPB.
    //
    // Ejemplo de flujo real:
    // 1. Bind al servidor LDAP con credenciales de servicio
    // 2. Buscar el usuario por su username
    // 3. Intentar bind con las credenciales del usuario
    // 4. Si el bind es exitoso, retornar los datos del usuario

    return null; // Retorna null = credenciales inválidas
  }
}
