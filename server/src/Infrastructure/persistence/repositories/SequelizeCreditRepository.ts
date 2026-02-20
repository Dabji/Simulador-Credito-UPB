// ============================================================
// Repository Implementation: SequelizeCreditRepository
// ============================================================

import { Credit, AmortizationType } from '../../../Core/entities/Credit';
import type { ICreditRepository } from '../../../Core/repositories/ICreditRepository';
import { CreditModel } from '../models/CreditModel';

export class SequelizeCreditRepository implements ICreditRepository {
  async findById(id: string): Promise<Credit | null> {
    const row = await CreditModel.findByPk(id);
    return row ? this.toDomain(row) : null;
  }

  async findByUserId(userId: string): Promise<Credit[]> {
    const rows = await CreditModel.findAll({ where: { user_id: userId } });
    return rows.map((row) => this.toDomain(row));
  }

  async findAll(): Promise<Credit[]> {
    const rows = await CreditModel.findAll();
    return rows.map((row) => this.toDomain(row));
  }

  async save(credit: Credit): Promise<Credit> {
    const row = await CreditModel.create({
      id: credit.id,
      user_id: credit.userId,
      amount: credit.amount,
      annual_rate: credit.annualRate,
      term_months: credit.termMonths,
      amortization_type: credit.amortizationType,
      monthly_payment: credit.monthlyPayment,
      total_interest: credit.totalInterest,
      total_payment: credit.totalPayment,
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await CreditModel.destroy({ where: { id } });
  }

  private toDomain(row: CreditModel): Credit {
    return Credit.reconstitute({
      id: row.id,
      userId: row.user_id,
      amount: Number(row.amount),
      annualRate: Number(row.annual_rate),
      termMonths: row.term_months,
      amortizationType: row.amortization_type as AmortizationType,
      monthlyPayment: Number(row.monthly_payment),
      totalInterest: Number(row.total_interest),
      totalPayment: Number(row.total_payment),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
