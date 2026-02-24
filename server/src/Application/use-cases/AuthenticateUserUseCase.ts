// ============================================================
// Use Case: AuthenticateUser
// Maneja la autenticación de usuarios vía LDAP/AD.
// ============================================================

import { User, UserRole } from '../../Core/entities/User';
import type { IUserRepository } from '../../Core/repositories/IUserRepository';
import { UnauthorizedError } from '../../Core/errors/AppError';

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

export interface AuthenticateUserInput {
  username: string;
  password: string;
}

export interface AuthenticateUserOutput {
  user: User;
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

  async execute(input: AuthenticateUserInput): Promise<AuthenticateUserOutput> {
    // 1. Autenticar contra LDAP/AD
    const ldapUser = await this.authService.authenticate(
      input.username,
      input.password,
    );

    if (!ldapUser) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // 2. Buscar o crear el usuario en la BD local
    let user = await this.userRepository.findByEmail(ldapUser.email);

    if (!user) {
      user = User.create({
        id: crypto.randomUUID(),
        email: ldapUser.email,
        firstName: ldapUser.firstName,
        lastName: ldapUser.lastName,
        identificationNumber: ldapUser.identificationNumber,
        role: UserRole.STUDENT,
        isActive: true,
      });
      user = await this.userRepository.save(user);
    }

    // 3. Generar JWT
    const token = this.tokenService.generate({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }
}
