// ============================================================
// Repository Pattern: ICreditRepository
// ============================================================

import { Credit } from '../entities/Credit';

export interface ICreditRepository {
  findById(id: string): Promise<Credit | null>;
  findByUserId(userId: string): Promise<Credit[]>;
  findAll(): Promise<Credit[]>;
  save(credit: Credit): Promise<Credit>;
  delete(id: string): Promise<void>;
}
