// ============================================================
// Sequelize Implementation: SequelizeParameterVersionRepository
// Lee la versión activa de parámetros de la BD con sus reglas.
// ============================================================

import { Op } from 'sequelize';
import { ParameterVersionModel } from '../models/ParameterVersionModel';
import { InterestRateModel } from '../models/InterestRateModel';
import { ModalityRuleModel } from '../models/ModalityRuleModel';
import { InitialPaymentRuleModel } from '../models/InitialPaymentRuleModel';
import type {
  IParameterVersionRepository,
  ActiveParameterVersion,
} from '../../../Core/repositories/IParameterVersionRepository';

export class SequelizeParameterVersionRepository implements IParameterVersionRepository {

  async findActive(): Promise<ActiveParameterVersion | null> {
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

    const version = await ParameterVersionModel.findOne({
      where: {
        valid_from: { [Op.lte]: today },
        [Op.or]: [
          { valid_to: null },
          { valid_to: { [Op.gte]: today } },
        ],
      },
      order: [['valid_from', 'DESC']],
    });

    if (!version) return null;
    return this.buildWithRules(version);
  }

  async findById(id: string): Promise<ActiveParameterVersion | null> {
    const version = await ParameterVersionModel.findByPk(id);
    if (!version) return null;
    return this.buildWithRules(version);
  }

  private async buildWithRules(version: ParameterVersionModel): Promise<ActiveParameterVersion> {
    const versionId = version.id;

    const [rates, modRules, initRules] = await Promise.all([
      InterestRateModel.findAll({ where: { parameter_version_id: versionId } }),
      ModalityRuleModel.findAll({ where: { parameter_version_id: versionId } }),
      InitialPaymentRuleModel.findAll({ where: { parameter_version_id: versionId } }),
    ]);

    return {
      id: version.id,
      validFrom: version.valid_from,
      validTo: version.valid_to,
      installmentsWindowFrom: version.installments_window_from,
      installmentsWindowTo: version.installments_window_to,
      paymentPeriodDays: version.payment_period_days,
      interestRates: rates.map(r => ({
        levelScope: r.level_scope,
        rateMonthly: Number(r.rate_monthly),
      })),
      modalityRules: modRules.map(m => ({
        modality: m.modality,
        level: m.level,
        maxTotalPayments: m.max_total_payments,
        minInitialPct: Number(m.min_initial_pct),
      })),
      initialPaymentRules: initRules.map(i => ({
        level: i.level,
        modality: i.modality,
        extraInstallments: i.extra_installments,
        initialPctRequired: Number(i.initial_pct_required),
      })),
    };
  }
}
