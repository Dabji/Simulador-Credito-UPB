// ============================================================
// Use Case: AuthenticateUser (HU-02)
// Lógica dual: STUDENT → BD local + bcrypt
//              ADMIN   → LDAP/AD
// ============================================================

import bcrypt from 'bcrypt';
import { User, UserRole } from '../../Core/entities/User';
import type { IUserRepository } from '../../Core/repositories/IUserRepository';
import { UnauthorizedError } from '../../Core/errors';
import type { LoginUserInput } from '../dtos/LoginUserInput';

// Interfaz para el servicio de autenticación (LDAP, local, etc.)
export interface IAuthService {
  authenticate(username: string, password: string): Promise<LdapUserData | null>;
}

export interface LdapUserData {
  email: string;
  firstName: string;
  lastName: string;
  identificationNumber: string;
}

export interface AuthenticateUserOutput {
  user: Omit<import('../../Core/entities/User').UserProps, 'password'>;
  token: string;
}

// Interfaz para generación de tokens JWT
export interface ITokenService {
  generate(payload: Record<string, unknown>): string;
  verify(token: string): Record<string, unknown> | null;
}

export class AuthenticateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authService: IAuthService,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(input: LoginUserInput): Promise<AuthenticateUserOutput> {
    if (input.role === 'STUDENT') {
      return this.authenticateStudent(input.email, input.password);
    }
    return this.authenticateAdmin(input.email, input.password);
  }

  // ── Estudiante: buscar en BD local y comparar con bcrypt ──
  private async authenticateStudent(
    email: string,
    password: string,
  ): Promise<AuthenticateUserOutput> {
    const user = await this.userRepository.findByEmail(email);

    if (!user || !user.password) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    if (user.role !== UserRole.STUDENT) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('La cuenta está desactivada');
    }

    return await this.buildOutput(user);
  }

  // ── Administrador: delegar validación al servicio LDAP ──
  private async authenticateAdmin(
    email: string,
    password: string,
  ): Promise<AuthenticateUserOutput> {
    const ldapUser = await this.authService.authenticate(email, password);

    if (ldapUser) {
      // Flujo LDAP exitoso: buscar o crear el admin en la BD local
      let user = await this.userRepository.findByEmail(ldapUser.email);

      if (!user) {
        user = User.create({
          id: crypto.randomUUID(),
          email: ldapUser.email,
          firstName: ldapUser.firstName,
          lastName: ldapUser.lastName,
          identificationNumber: ldapUser.identificationNumber,
          role: UserRole.ADMIN,
          isActive: true,
        });
        user = await this.userRepository.save(user);
      }

      return await this.buildOutput(user);
    }

    // Fallback: autenticar con bcrypt contra la BD local (útil en desarrollo
    // cuando LDAP no está disponible o el admin fue creado via seed).
    const user = await this.userRepository.findByEmail(email);

    if (!user || !user.password) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    if (user.role !== UserRole.ADMIN) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('La cuenta está desactivada');
    }

    return await this.buildOutput(user);
  }

  // ── Genera JWT, actualiza last_login_at y retorna usuario sin password ──
  private async buildOutput(user: User): Promise<AuthenticateUserOutput> {
    // Registrar el momento del login (last_login_at) en BD
    await this.userRepository.updateLastLogin(user.id);

    const token = this.tokenService.generate({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Excluir password del objeto retornado
    const { password: _, ...userWithoutPassword } = user.toJSON();
    void _;

    return { user: userWithoutPassword, token };
  }
}
