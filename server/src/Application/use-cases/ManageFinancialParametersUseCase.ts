// ============================================================
// Use Case: ManageFinancialParameters
// CRUD de parámetros financieros por parte del admin.
// ============================================================

import { FinancialParameter } from '../../Core/entities/FinancialParameter';
import type { IFinancialParameterRepository } from '../../Core/repositories/IFinancialParameterRepository';
import { NotFoundError } from '../../Core/errors';

export interface UpdateParameterInput {
  id: string;
  value: number;
  updatedBy: string; // userId del admin
}

export class ManageFinancialParametersUseCase {
  constructor(
    private readonly paramRepository: IFinancialParameterRepository,
  ) {}

  async getAll(): Promise<FinancialParameter[]> {
    return this.paramRepository.findAllActive();
  }

  async getByName(name: string): Promise<FinancialParameter | null> {
    return this.paramRepository.findByName(name);
  }

  async update(input: UpdateParameterInput): Promise<FinancialParameter> {
    const existing = await this.paramRepository.findById(input.id);
    if (!existing) {
      throw new NotFoundError(`Parámetro financiero ${input.id}`);
    }

    const updated = FinancialParameter.create({
      ...existing.toJSON(),
      value: input.value,
      updatedBy: input.updatedBy,
    });

    return this.paramRepository.update(updated);
  }
}
