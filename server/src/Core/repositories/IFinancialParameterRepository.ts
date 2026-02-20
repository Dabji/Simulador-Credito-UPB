// ============================================================
// Repository Pattern: IFinancialParameterRepository
// ============================================================

import { FinancialParameter } from '../entities/FinancialParameter';

export interface IFinancialParameterRepository {
  findById(id: string): Promise<FinancialParameter | null>;
  findByName(name: string): Promise<FinancialParameter | null>;
  findAllActive(): Promise<FinancialParameter[]>;
  save(param: FinancialParameter): Promise<FinancialParameter>;
  update(param: FinancialParameter): Promise<FinancialParameter>;
}
