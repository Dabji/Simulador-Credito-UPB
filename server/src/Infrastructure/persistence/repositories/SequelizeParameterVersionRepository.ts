// ============================================================
// Sequelize Implementation: SequelizeParameterVersionRepository
// Lee la versión activa de parámetros de la BD con sus reglas.
// ============================================================

import { Op } from 'sequelize';
import { Database } from '../../config/database';
import { ParameterVersionModel } from '../models/ParameterVersionModel';
import { InterestRateModel } from '../models/InterestRateModel';
import { ModalityRuleModel } from '../models/ModalityRuleModel';
import { InitialPaymentRuleModel } from '../models/InitialPaymentRuleModel';
import type {
  IParameterVersionRepository,
  ActiveParameterVersion,
  ParameterVersionSummary,
  UpdateParameterVersionData,
  CreateParameterVersionData,
} from '../../../Core/repositories/IParameterVersionRepository';

export class SequelizeParameterVersionRepository implements IParameterVersionRepository {

  /** Returns today's date (YYYY-MM-DD) in Colombia time (America/Bogota), regardless of server TZ. */
  private static todayInColombia(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
  }

  async findActive(): Promise<ActiveParameterVersion | null> {
    const today = SequelizeParameterVersionRepository.todayInColombia();

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

  async findAll(): Promise<ParameterVersionSummary[]> {
    const today = SequelizeParameterVersionRepository.todayInColombia();

    const versions = await ParameterVersionModel.findAll({
      order: [['valid_from', 'DESC']],
    });

    return versions.map(v => {
      const isActive =
        v.valid_from <= today &&
        (v.valid_to === null || v.valid_to >= today);
      return {
        id: v.id,
        validFrom: v.valid_from,
        validTo: v.valid_to,
        notes: v.notes,
        createdAt: v.created_at,
        isActive,
      };
    });
  }

  async hasOverlap(
    validFrom: string,
    validTo: string | null,
    excludeId?: string,
  ): Promise<boolean> {
    // Una versión B se superpone con [validFrom, validTo] si:
    //   B.valid_from <= validTo  AND  (B.valid_to IS NULL OR B.valid_to >= validFrom)
    const where: Record<string, unknown> = {
      valid_from: { [Op.lte]: validTo ?? '9999-12-31' },
      [Op.or]: [
        { valid_to: null },
        { valid_to: { [Op.gte]: validFrom } },
      ],
    };

    if (excludeId) {
      (where as Record<string, unknown>).id = { [Op.ne]: excludeId };
    }

    const count = await ParameterVersionModel.count({ where });
    return count > 0;
  }

  async updateVersion(
    id: string,
    data: UpdateParameterVersionData,
  ): Promise<ActiveParameterVersion | null> {
    const version = await ParameterVersionModel.findByPk(id);
    if (!version) return null;

    const sequelize = Database.getInstance().getSequelize();

    await sequelize.transaction(async (t) => {
      // Actualizar campos de la versión
      const versionUpdates: Record<string, unknown> = {};
      if (data.validFrom !== undefined) versionUpdates.valid_from = data.validFrom;
      if (data.validTo !== undefined) versionUpdates.valid_to = data.validTo;
      if (data.notes !== undefined) versionUpdates.notes = data.notes;
      if (data.installmentsWindowFrom !== undefined) versionUpdates.installments_window_from = data.installmentsWindowFrom;
      if (data.installmentsWindowTo !== undefined) versionUpdates.installments_window_to = data.installmentsWindowTo;
      if (data.paymentPeriodDays !== undefined) versionUpdates.payment_period_days = data.paymentPeriodDays;

      if (Object.keys(versionUpdates).length > 0) {
        await version.update(versionUpdates, { transaction: t });
      }

      // Reemplazar tasas de interés si se proporcionaron
      // undefined = no tocar; [] = reemplazar por vacío
      if (data.interestRates !== undefined) {
        await InterestRateModel.destroy({ where: { parameter_version_id: id }, transaction: t });
        for (const rate of data.interestRates) {
          await InterestRateModel.create(
            {
              id: crypto.randomUUID(),
              rate_monthly: rate.rateMonthly,
              rate_type: 'MV',
              level_scope: rate.levelScope,
              parameter_version_id: id,
            },
            { transaction: t },
          );
        }
      }

      // Reemplazar reglas de modalidad si se proporcionaron
      // undefined = no tocar; [] = reemplazar por vacío
      if (data.modalityRules !== undefined) {
        await ModalityRuleModel.destroy({ where: { parameter_version_id: id }, transaction: t });
        for (const rule of data.modalityRules) {
          await ModalityRuleModel.create(
            {
              id: crypto.randomUUID(),
              modality: rule.modality,
              level: rule.level,
              max_total_payments: rule.maxTotalPayments,
              min_initial_pct: rule.minInitialPct,
              parameter_version_id: id,
            },
            { transaction: t },
          );
        }
      }

      // Reemplazar reglas de cuota inicial si se proporcionaron
      // undefined = no tocar; [] = reemplazar por vacío
      if (data.initialPaymentRules !== undefined) {
        await InitialPaymentRuleModel.destroy({ where: { parameter_version_id: id }, transaction: t });
        for (const rule of data.initialPaymentRules) {
          await InitialPaymentRuleModel.create(
            {
              id: crypto.randomUUID(),
              level: rule.level,
              modality: rule.modality,
              extra_installments: rule.extraInstallments,
              initial_pct_required: rule.initialPctRequired,
              parameter_version_id: id,
            },
            { transaction: t },
          );
        }
      }
    });

    // Recargar versión actualizada
    const updated = await ParameterVersionModel.findByPk(id);
    if (!updated) return null;
    return this.buildWithRules(updated);
  }

  async createVersion(data: CreateParameterVersionData): Promise<ActiveParameterVersion> {
    const sequelize = Database.getInstance().getSequelize();
    const versionId = crypto.randomUUID();

    await sequelize.transaction(async (t) => {
      await ParameterVersionModel.create(
        {
          id: versionId,
          valid_from: data.validFrom,
          valid_to: data.validTo ?? null,
          notes: data.notes ?? null,
          installments_window_from: data.validFrom,
          installments_window_to: data.validTo ?? data.validFrom,
          payment_period_days: 30,
          created_by: data.createdBy,
        },
        { transaction: t },
      );

      for (const rate of data.interestRates) {
        await InterestRateModel.create(
          {
            id: crypto.randomUUID(),
            rate_monthly: rate.rateMonthly,
            rate_type: 'MV',
            level_scope: rate.levelScope,
            parameter_version_id: versionId,
          },
          { transaction: t },
        );
      }

      for (const rule of data.modalityRules) {
        await ModalityRuleModel.create(
          {
            id: crypto.randomUUID(),
            modality: rule.modality,
            level: rule.level,
            max_total_payments: rule.maxTotalPayments,
            min_initial_pct: rule.minInitialPct,
            parameter_version_id: versionId,
          },
          { transaction: t },
        );
      }

      for (const rule of data.initialPaymentRules) {
        await InitialPaymentRuleModel.create(
          {
            id: crypto.randomUUID(),
            level: rule.level,
            modality: rule.modality,
            extra_installments: rule.extraInstallments,
            initial_pct_required: rule.initialPctRequired,
            parameter_version_id: versionId,
          },
          { transaction: t },
        );
      }
    });

    const created = await ParameterVersionModel.findByPk(versionId);
    if (!created) throw new Error('No se pudo crear la versión de parámetros');
    return this.buildWithRules(created);
  }

  async activateVersion(id: string): Promise<ActiveParameterVersion | null> {
    const version = await ParameterVersionModel.findByPk(id);
    if (!version) return null;

    const today = SequelizeParameterVersionRepository.todayInColombia();
    const yesterday = new Date(new Date(today).getTime() - 86_400_000)
      .toISOString().slice(0, 10);

    const sequelize = Database.getInstance().getSequelize();

    await sequelize.transaction(async (t) => {
      // Desactivar todas las demás versiones
      await ParameterVersionModel.update(
        { valid_to: yesterday },
        { where: { id: { [Op.ne]: id } }, transaction: t },
      );
      // Activar la versión objetivo
      await ParameterVersionModel.update(
        { valid_from: today, valid_to: null },
        { where: { id }, transaction: t },
      );
    });

    // Recargar la versión actualizada
    await version.reload();
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
