// ============================================================
// Use Case: RegisterUser
// Maneja el registro de nuevos usuarios en el sistema (HU-01).
// ============================================================

import bcrypt from 'bcrypt';
import { User, UserRole } from '../../Core/entities/User';
import type { IUserRepository } from '../../Core/repositories/IUserRepository';
import { ConflictError } from '../../Core/errors';
import type { RegisterUserInput } from '../dtos/RegisterUserInput';

const SALT_ROUNDS = 10;

export class RegisterUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: RegisterUserInput): Promise<void> {
    const existingByEmail = await this.userRepository.findByEmail(input.email);
    if (existingByEmail) {
      throw new ConflictError('El correo electrónico ya está registrado');
    }

    const existingByDocument = await this.userRepository.findByDocument(input.documentNumber);
    if (existingByDocument) {
      throw new ConflictError('El número de documento ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = User.create({
      id: crypto.randomUUID(),
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      documentType: input.documentType,
      identificationNumber: input.documentNumber,
      password: hashedPassword,
      phone: input.phone,
      role: UserRole.STUDENT,
      isActive: true,
      termsAcceptedAt: new Date(),
    });

    await this.userRepository.save(user);
  }
}
