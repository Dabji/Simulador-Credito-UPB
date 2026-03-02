// ============================================================
// Sequelize Implementation: SequelizeSimulationRepository
// Persiste y consulta simulaciones + filas de amortización.
// ============================================================

import { Database } from '../../config/database';
import { SimulationModel } from '../models/SimulationModel';
import { AmortizationRowModel } from '../models/AmortizationRowModel';
import type {
  ISimulationRepository,
  SaveSimulationData,
  PersistedSimulation,
} from '../../../Core/repositories/ISimulationRepository';
import type { AmortizationRowDTO } from '../../../Application/dtos/SimulationSummary';

export class SequelizeSimulationRepository implements ISimulationRepository {

  async save(data: SaveSimulationData): Promise<{ id: string; savedAt: Date }> {
    const sequelize = Database.getInstance().getSequelize();
    const savedAt = new Date();

    await sequelize.transaction(async (t) => {
      // 1. Crear simulación
      await SimulationModel.create(
        {
          id: data.id,
          saved_at: savedAt,
          student_type: data.studentType as 'NUEVO' | 'CONTINUO',
          level: data.level as 'PREGRADO' | 'POSGRADO' | 'UPB_TEC',
          modality: data.modality as 'SIN_INTERES' | 'CON_INTERES',
          tuition_gross: data.tuitionGross,
          scholar_pct: data.scholarPct,
          tuition_net: data.tuitionNet,
          initial_payment_pct: data.initialPaymentPct,
          initial_payment_value: data.initialPaymentValue,
          total_payments: data.totalPayments,
          first_payment_date: data.firstPaymentDate,
          financed_value: data.financedValue,
          periodic_payment_value: data.periodicPaymentValue,
          total_interest: data.totalInterest,
          total_paid: data.totalPaid,
          applied_rate_monthly: data.appliedRateMonthly,
          student_observation: data.studentObservation,
          user_id: data.userId,
          parameter_version_id: data.parameterVersionId,
        },
        { transaction: t },
      );

      // 2. Crear filas de amortización
      if (data.schedule.length > 0) {
        const rows = data.schedule.map((row) => ({
          id: crypto.randomUUID(),
          payment_no: row.period,
          scheduled_date: row.date,
          payment_value: row.payment,
          interest_value: row.interest,
          principal_value: row.principal,
          balance_after: row.finalBalance,
          simulation_id: data.id,
        }));

        await AmortizationRowModel.bulkCreate(rows, { transaction: t });
      }
    });

    return { id: data.id, savedAt };
  }

  async findByUserId(userId: string): Promise<PersistedSimulation[]> {
    const simulations = await SimulationModel.findAll({
      where: {
        user_id: userId,
        deleted_at: null,
      },
      order: [['saved_at', 'DESC']],
    });

    const results: PersistedSimulation[] = [];
    for (const sim of simulations) {
      const rows = await AmortizationRowModel.findAll({
        where: { simulation_id: sim.id },
        order: [['payment_no', 'ASC']],
      });
      results.push(this.toPersistedSimulation(sim, rows));
    }
    return results;
  }

  async findById(id: string): Promise<PersistedSimulation | null> {
    const sim = await SimulationModel.findOne({
      where: { id, deleted_at: null },
    });
    if (!sim) return null;

    const rows = await AmortizationRowModel.findAll({
      where: { simulation_id: sim.id },
      order: [['payment_no', 'ASC']],
    });

    return this.toPersistedSimulation(sim, rows);
  }

  private toPersistedSimulation(
    sim: SimulationModel,
    rows: AmortizationRowModel[],
  ): PersistedSimulation {
    const schedule: AmortizationRowDTO[] = rows.map((r) => ({
      period: r.payment_no,
      date: r.scheduled_date,
      initialBalance: r.payment_no === 1
        ? Number(sim.financed_value)
        : Number(r.balance_after) + Number(r.principal_value),
      principal: Number(r.principal_value),
      interest: Number(r.interest_value),
      payment: Number(r.payment_value),
      finalBalance: Number(r.balance_after),
    }));

    return {
      id: sim.id,
      userId: sim.user_id,
      savedAt: sim.saved_at,
      summary: {
        id: sim.id,
        tuitionGross: Number(sim.tuition_gross),
        scholarshipPct: Number(sim.scholar_pct) * 100,
        tuitionNet: Number(sim.tuition_net),
        initialPayment: Number(sim.initial_payment_value),
        initialPaymentPct: Number(sim.initial_payment_pct) * 100,
        financedValue: Number(sim.financed_value),
        interestMode: sim.modality === 'CON_INTERES' ? 'con_interes' : 'sin_interes',
        academicPeriod: '',          // not stored in simulations table
        firstPaymentMonth: new Date(sim.first_payment_date).getMonth() + 1,
        numberOfPayments: sim.total_payments,
        periodicPayment: Number(sim.periodic_payment_value),
        totalPaid: Number(sim.total_paid),
        totalInterest: Number(sim.total_interest),
        schedule,
      },
    };
  }
}
