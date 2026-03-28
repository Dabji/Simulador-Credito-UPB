// ============================================================
// Repository Implementation: SequelizeUserRepository
// Implementa IUserRepository usando Sequelize + MySQL.
// ============================================================

import { User, UserRole } from '../../../Core/entities/User';
import type { DocumentType } from '../../../Core/entities/User';
import type { IUserRepository } from '../../../Core/repositories/IUserRepository';
import { UserModel } from '../models/UserModel';

export class SequelizeUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const row = await UserModel.findByPk(id);
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await UserModel.findOne({ where: { email } });
    return row ? this.toDomain(row) : null;
  }

  async findByIdentification(identificationNumber: string): Promise<User | null> {
    const row = await UserModel.findOne({
      where: { document_number: identificationNumber },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByDocument(documentNumber: string): Promise<User | null> {
    const row = await UserModel.findOne({
      where: { document_number: documentNumber },
    });
    return row ? this.toDomain(row) : null;
  }

  async findAll(options?: { limit?: number; offset?: number }): Promise<{ rows: User[]; count: number }> {
    const { rows, count } = await UserModel.findAndCountAll({
      ...(options?.limit  != null ? { limit: options.limit }   : {}),
      ...(options?.offset != null ? { offset: options.offset } : {}),
      order: [['created_at', 'DESC']],
    });
    return { rows: rows.map((row) => this.toDomain(row)), count };
  }

  async save(user: User): Promise<User> {
    const row = await UserModel.create({
      id: user.id,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      document_type: user.documentType ?? null,
      document_number: user.identificationNumber,
      password: user.password ?? null,
      phone: user.phone ?? null,
      role: user.role,
      is_active: user.isActive,
      terms_accepted_at: user.termsAcceptedAt ?? null,
    });
    return this.toDomain(row);
  }

  async update(user: User): Promise<User> {
    await UserModel.update(
      {
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        document_type: user.documentType ?? null,
        document_number: user.identificationNumber,
        password: user.password ?? null,
        phone: user.phone ?? null,
        role: user.role,
        is_active: user.isActive,
        terms_accepted_at: user.termsAcceptedAt ?? null,
      },
      { where: { id: user.id } },
    );
    const updated = await UserModel.findByPk(user.id);
    if (!updated) throw new Error(`Usuario no encontrado: ${user.id}`);
    return this.toDomain(updated);
  }

  async updateLastLogin(userId: string): Promise<void> {
    await UserModel.update(
      { last_login_at: new Date() },
      { where: { id: userId } },
    );
  }

  async delete(id: string): Promise<void> {
    await UserModel.destroy({ where: { id } });
  }

  // ── Mapper: ORM → Domain ───────────────────────────────────
  private toDomain(row: UserModel): User {
    return User.reconstitute({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      documentType: (row.document_type ?? undefined) as DocumentType | undefined,
      identificationNumber: row.document_number,
      password: row.password ?? undefined,
      phone: row.phone ?? undefined,
      role: row.role as UserRole,
      isActive: row.is_active,
      termsAcceptedAt: row.terms_accepted_at,
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
