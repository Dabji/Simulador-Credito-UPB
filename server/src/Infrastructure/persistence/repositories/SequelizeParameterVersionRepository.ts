// ============================================================
// Sequelize Implementation: SequelizeParameterVersionRepository
// Lee la versión activa de parámetros de la BD con sus reglas.
// ============================================================

import { Op } from 'sequelize';
import { Database } from '../../config/database';
import { auditLog } from '../../../Application/services/AuditService';
import { ParameterVersionModel } from '../models/ParameterVersionModel';
import { InitialPaymentRuleModel } from '../models/InitialPaymentRuleModel';
import { LevelConfigModel } from '../models/LevelConfigModel';
import { LevelRateRuleModel } from '../models/LevelRateRuleModel';
import type {
  IParameterVersionRepository,
  ActiveParameterVersion,
  ActiveLevelConfig,
  ActiveLevelConfigHeader,
  ParameterVersionSummary,
  UpdateParameterVersionData,
  CreateParameterVersionData,
  CreateLevelConfigData,
  ReactivateLevelConfigData,
} from '../../../Core/repositories/IParameterVersionRepository';

export class SequelizeParameterVersionRepository implements IParameterVersionRepository {

  // ── Caché en memoria de la versión activa ────────────────────────────
  // La versión activa cambia rara vez (solo cuando un admin la modifica).
  // TTL de 60 s evita ir 4 veces a Aiven por cada request del simulador.
  private static _activeCache: ActiveParameterVersion | null = null;
  private static _activeCacheValid = false;
  private static _activeCacheTs = 0;
  private static readonly CACHE_TTL_MS = 60_000; // 60 segundos

  /** Invalida el caché — llamar después de cualquier mutación de parámetros. */
  private static invalidateActiveCache(): void {
    SequelizeParameterVersionRepository._activeCache = null;
    SequelizeParameterVersionRepository._activeCacheValid = false;
    SequelizeParameterVersionRepository._activeCacheTs = 0;
  }

  /** Returns today's date (YYYY-MM-DD) in Colombia time (America/Bogota), regardless of server TZ. */
  private static todayInColombia(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
  }

  async findActive(): Promise<ActiveParameterVersion | null> {
    // Servir desde caché si aún es válido
    const now = Date.now();
    if (
      SequelizeParameterVersionRepository._activeCacheValid &&
      now - SequelizeParameterVersionRepository._activeCacheTs < SequelizeParameterVersionRepository.CACHE_TTL_MS
    ) {
      return SequelizeParameterVersionRepository._activeCache;
    }

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

    if (!version) {
      SequelizeParameterVersionRepository._activeCache = null;
      SequelizeParameterVersionRepository._activeCacheValid = true;
      SequelizeParameterVersionRepository._activeCacheTs = now;
      return null;
    }

    const result = await this.buildWithRules(version);
    SequelizeParameterVersionRepository._activeCache = result;
    SequelizeParameterVersionRepository._activeCacheValid = true;
    SequelizeParameterVersionRepository._activeCacheTs = now;
    return result;
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

      // Reemplazar reglas de cuota inicial si se proporcionaron
      // undefined = no tocar; [] = reemplazar por vacío
      if (data.initialPaymentRules !== undefined) {
        await InitialPaymentRuleModel.destroy({ where: { parameter_version_id: id }, transaction: t });
        await InitialPaymentRuleModel.bulkCreate(
          data.initialPaymentRules.map(rule => ({
            id: crypto.randomUUID(),
            level: rule.level,
            modality: rule.modality,
            extra_installments: rule.extraInstallments,
            initial_pct_required: rule.initialPctRequired,
            parameter_version_id: id,
          })),
          { transaction: t },
        );
      }

      // HU-PV-01: Reemplazar configuración por nivel si se proporcionó (estructura plana)
      if (data.levelConfigs !== undefined) {
        const createdBy = data.createdBy ?? 'SYSTEM';

        // ── Validaciones de negocio (reemplazan triggers BEFORE) ─────────
        // Solo validar niveles activos — los inactivos no tienen validFrom ni restricciones de tasa
        const validationMap = new Map<string, { maxSin: number; maxCon: number; counts: number[] }>();
        for (const lc of data.levelConfigs) {
          if (!lc.isActive) continue;
          const key = `${lc.levelScope}|${lc.validFrom}`;
          const maxSin = lc.maxPaymentsSinInteres ?? 3;
          const maxCon = lc.maxPaymentsConInteres ?? 6;
          if (!validationMap.has(key)) {
            validationMap.set(key, { maxSin, maxCon, counts: [] });
          }
          const entry = validationMap.get(key)!;
          // Regla 1: payment_count entre 1 y 6
          if (lc.paymentCount < 1 || lc.paymentCount > 6) {
            throw new Error(`payment_count ${lc.paymentCount} debe estar entre 1 y 6`);
          }
          // Regla 2: payment_count no supera max_payments_con_interes
          if (lc.paymentCount > maxCon) {
            throw new Error(`payment_count ${lc.paymentCount} supera maxPaymentsConInteres (${maxCon}) en nivel ${lc.levelScope}`);
          }
          // Regla 3: rate_monthly en rango válido [0, 1]
          if (!Number.isFinite(lc.rateMonthly) || lc.rateMonthly < 0 || lc.rateMonthly > 1) {
            throw new Error(`rateMonthly ${lc.rateMonthly} debe estar entre 0 y 1 para nivel ${lc.levelScope}`);
          }
          // Regla 4: maxPaymentsSinInteres <= maxPaymentsConInteres
          if (maxSin > maxCon) {
            throw new Error(`maxPaymentsSinInteres (${maxSin}) no puede superar maxPaymentsConInteres (${maxCon}) en nivel ${lc.levelScope}`);
          }
          // Regla 5: coherencia tasa/límites — paymentCount <= sinMax debe tener rate=0;
          //           sinMax < paymentCount <= conMax debe tener rate > 0
          if (lc.paymentCount <= maxSin && lc.rateMonthly !== 0) {
            throw new Error(
              `paymentCount ${lc.paymentCount} en nivel ${lc.levelScope} está en rango SIN INTERÉS ` +
              `(máx sin interés: ${maxSin}) pero tiene rateMonthly ${lc.rateMonthly} ≠ 0.`,
            );
          }
          if (lc.paymentCount > maxSin && lc.paymentCount <= maxCon && lc.rateMonthly <= 0) {
            throw new Error(
              `paymentCount ${lc.paymentCount} en nivel ${lc.levelScope} está en rango CON INTERÉS ` +
              `pero tiene rateMonthly ${lc.rateMonthly} ≤ 0. Debe ser mayor a 0.`,
            );
          }
          entry.counts.push(lc.paymentCount);
        }

        // RESTRICT FK: borrar hijas primero, luego cabeceras
        const existingConfigs = await LevelConfigModel.findAll({
          where: { parameter_version_id: id },
          transaction: t,
        });
        const existingIds = existingConfigs.map(ec => ec.id);
        if (existingIds.length > 0) {
          await LevelRateRuleModel.destroy({ where: { level_config_id: existingIds }, transaction: t });
        }
        await LevelConfigModel.destroy({ where: { parameter_version_id: id }, transaction: t });

        // Guardar maxPayments por level_scope antes de destruir (fallback cuando el cliente no los envía)
        const existingMaxPayments = new Map<string, { sin: number; con: number }>();
        for (const ec of existingConfigs) {
          existingMaxPayments.set(ec.level_scope, {
            sin: ec.max_payments_sin_interes,
            con: ec.max_payments_con_interes,
          });
        }

        // Sugerencia 3: validar que no haya más de una cabecera activa por levelScope
        const activeByScope = new Map<string, number>();
        for (const lc of data.levelConfigs) {
          if (!lc.isActive) continue;
          const count = (activeByScope.get(lc.levelScope) ?? 0) + 1;
          activeByScope.set(lc.levelScope, count);
        }
        // Cada levelScope activo puede tener múltiples filas (una por paymentCount) pero todas
        // deben compartir el mismo validFrom (una sola cabecera activa por nivel)
        const activeScopeValidFroms = new Map<string, Set<string>>();
        for (const lc of data.levelConfigs) {
          if (!lc.isActive) continue;
          if (!activeScopeValidFroms.has(lc.levelScope)) {
            activeScopeValidFroms.set(lc.levelScope, new Set());
          }
          activeScopeValidFroms.get(lc.levelScope)!.add(lc.validFrom);
        }
        for (const [scope, validFroms] of activeScopeValidFroms) {
          if (validFroms.size > 1) {
            throw new Error(
              `El nivel ${scope} tiene múltiples validFrom activos: ${[...validFroms].join(', ')}. ` +
              'Solo puede existir una cabecera activa por nivel.',
            );
          }
        }

        // Agrupar filas planas por (levelScope, validFrom) → reconstruir cabecera + reglas
        const headerMap = new Map<string, {
          levelScope: 'PREGRADO' | 'POSGRADO' | 'UPB_Tech'; isActive: boolean; validFrom: string;
          maxPaymentsSinInteres: number; maxPaymentsConInteres: number;
          rules: { paymentCount: number; rateMonthly: number }[];
        }>();
        for (const lc of data.levelConfigs) {
          const key = `${lc.levelScope}|${lc.validFrom}`;
          if (!headerMap.has(key)) {
            const prevMaxPay = existingMaxPayments.get(lc.levelScope);
            headerMap.set(key, {
              levelScope: lc.levelScope as 'PREGRADO' | 'POSGRADO' | 'UPB_Tech',
              isActive: lc.isActive, validFrom: lc.validFrom,
              maxPaymentsSinInteres: lc.maxPaymentsSinInteres ?? prevMaxPay?.sin ?? 3,
              maxPaymentsConInteres: lc.maxPaymentsConInteres ?? prevMaxPay?.con ?? 6,
              rules: [],
            });
          }
          headerMap.get(key)!.rules.push({ paymentCount: lc.paymentCount, rateMonthly: lc.rateMonthly });
        }

        const todayCol = SequelizeParameterVersionRepository.todayInColombia();
        for (const [, header] of headerMap) {
          const lcId = crypto.randomUUID();
          const validFromValue = header.isActive ? header.validFrom : (header.validFrom || todayCol);
          await LevelConfigModel.create(
            {
              id: lcId,
              level_scope: header.levelScope,
              is_active: header.isActive,
              valid_from: validFromValue,
              valid_to: header.isActive ? null : todayCol,
              max_payments_sin_interes: header.maxPaymentsSinInteres,
              max_payments_con_interes: header.maxPaymentsConInteres,
              parameter_version_id: id,
              created_by: createdBy,
            },
            { transaction: t },
          );
          // bulkCreate para todas las reglas de tasa de este nivel de una sola vez
          await LevelRateRuleModel.bulkCreate(
            header.rules.map(rr => ({
              id: crypto.randomUUID(),
              level_config_id: lcId,
              payment_count: rr.paymentCount,
              rate_monthly: rr.rateMonthly,
            })),
            { transaction: t },
          );
          void auditLog({
            action: header.isActive ? 'LEVEL_CONFIG_SAVED' : 'LEVEL_CONFIG_DEACTIVATED',
            entity: 'LEVEL_CONFIG',
            entity_id: lcId,
            actor_type: 'ADMIN',
            user_id: data.actorUserId ?? null,
            ip_address: data.actorIpAddress ?? null,
            details: {
              levelScope: header.levelScope,
              isActive: header.isActive,
              validFrom: header.validFrom,
              validTo: header.isActive ? null : todayCol,
              maxPaymentsSinInteres: header.maxPaymentsSinInteres,
              maxPaymentsConInteres: header.maxPaymentsConInteres,
              rateRules: header.rules,
              parameterVersionId: id,
            },
          });
        }
      }
    });

    SequelizeParameterVersionRepository.invalidateActiveCache();

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

      await InitialPaymentRuleModel.bulkCreate(
        data.initialPaymentRules.map(rule => ({
          id: crypto.randomUUID(),
          level: rule.level,
          modality: rule.modality,
          extra_installments: rule.extraInstallments,
          initial_pct_required: rule.initialPctRequired,
          parameter_version_id: versionId,
        })),
        { transaction: t },
      );

      // HU-PV-01: Persistir configuración por nivel (estructura plana → agrupar por header)
      if (data.levelConfigs) {
        // ── Validaciones de negocio (reemplazan triggers BEFORE) ─────────
        // Solo validar niveles activos — los inactivos no tienen validFrom ni restricciones
        for (const lc of data.levelConfigs) {
          if (!lc.isActive) continue;
          const maxSin = lc.maxPaymentsSinInteres ?? 3;
          const maxCon = lc.maxPaymentsConInteres ?? 6;
          if (lc.paymentCount < 1 || lc.paymentCount > 6) {
            throw new Error(`payment_count ${lc.paymentCount} debe estar entre 1 y 6`);
          }
          if (lc.paymentCount > maxCon) {
            throw new Error(`payment_count ${lc.paymentCount} supera maxPaymentsConInteres (${maxCon}) en nivel ${lc.levelScope}`);
          }
          if (!Number.isFinite(lc.rateMonthly) || lc.rateMonthly < 0 || lc.rateMonthly > 1) {
            throw new Error(`rateMonthly ${lc.rateMonthly} debe estar entre 0 y 1 para nivel ${lc.levelScope}`);
          }
          if (maxSin > maxCon) {
            throw new Error(`maxPaymentsSinInteres (${maxSin}) no puede superar maxPaymentsConInteres (${maxCon}) en nivel ${lc.levelScope}`);
          }
        }

        const headerMapCreate = new Map<string, {
          levelScope: 'PREGRADO' | 'POSGRADO' | 'UPB_Tech'; isActive: boolean; validFrom: string;
          maxPaymentsSinInteres: number; maxPaymentsConInteres: number;
          rules: { paymentCount: number; rateMonthly: number }[];
        }>();
        for (const lc of data.levelConfigs) {
          const key = `${lc.levelScope}|${lc.validFrom}`;
          if (!headerMapCreate.has(key)) {
            headerMapCreate.set(key, {
              levelScope: lc.levelScope, isActive: lc.isActive, validFrom: lc.validFrom,
              maxPaymentsSinInteres: lc.maxPaymentsSinInteres ?? 3,
              maxPaymentsConInteres: lc.maxPaymentsConInteres ?? 6,
              rules: [],
            });
          }
          headerMapCreate.get(key)!.rules.push({ paymentCount: lc.paymentCount, rateMonthly: lc.rateMonthly });
        }
        const todayColCreate = SequelizeParameterVersionRepository.todayInColombia();
        for (const [, header] of headerMapCreate) {
          const lcId = crypto.randomUUID();
          const validFromValue = header.isActive ? header.validFrom : (header.validFrom || todayColCreate);
          await LevelConfigModel.create(
            {
              id: lcId,
              level_scope: header.levelScope,
              is_active: header.isActive,
              valid_from: validFromValue,
              valid_to: header.isActive ? null : todayColCreate,
              max_payments_sin_interes: header.maxPaymentsSinInteres,
              max_payments_con_interes: header.maxPaymentsConInteres,
              parameter_version_id: versionId,
              created_by: data.createdBy,
            },
            { transaction: t },
          );
          // bulkCreate para todas las reglas de tasa de este nivel de una sola vez
          await LevelRateRuleModel.bulkCreate(
            header.rules.map(rr => ({
              id: crypto.randomUUID(),
              level_config_id: lcId,
              payment_count: rr.paymentCount,
              rate_monthly: rr.rateMonthly,
            })),
            { transaction: t },
          );
        }
      }
    });

    SequelizeParameterVersionRepository.invalidateActiveCache();

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

    SequelizeParameterVersionRepository.invalidateActiveCache();

    // Recargar la versión actualizada
    await version.reload();
    return this.buildWithRules(version);
  }

  private async buildWithRules(version: ParameterVersionModel): Promise<ActiveParameterVersion> {
    const versionId = version.id;

    const [initRules, activeLvlConfigs] = await Promise.all([
      InitialPaymentRuleModel.findAll({ where: { parameter_version_id: versionId } }),
      LevelConfigModel.findAll({
        where: { parameter_version_id: versionId },
        order: [['valid_from', 'DESC']],
      }),
    ]);

    // JOIN con level_rate_rules — una sola query IN(...) para evitar N+1
    const configIds = activeLvlConfigs.map(lc => lc.id);
    const allRateRules = configIds.length > 0
      ? await LevelRateRuleModel.findAll({
          where: { level_config_id: configIds },
          order: [['payment_count', 'ASC']],
        })
      : [];
    const ratesByConfigId = new Map<string, typeof allRateRules>();
    for (const rr of allRateRules) {
      const list = ratesByConfigId.get(rr.level_config_id) ?? [];
      list.push(rr);
      ratesByConfigId.set(rr.level_config_id, list);
    }

    const levelConfigs: ActiveLevelConfig[] = [];
    for (const lc of activeLvlConfigs) {
      const rules = ratesByConfigId.get(lc.id) ?? [];
      for (const rr of rules) {
        levelConfigs.push({
          id: lc.id,
          levelScope: lc.level_scope,
          isActive: lc.is_active,
          validFrom: lc.valid_from,
          validTo: lc.valid_to,
          maxPaymentsSinInteres: lc.max_payments_sin_interes,
          maxPaymentsConInteres: lc.max_payments_con_interes,
          paymentCount: rr.payment_count,
          rateMonthly: Number(rr.rate_monthly),
        });
      }
    }

    return {
      id: version.id,
      validFrom: version.valid_from,
      validTo: version.valid_to,
      installmentsWindowFrom: version.installments_window_from,
      installmentsWindowTo: version.installments_window_to,
      paymentPeriodDays: version.payment_period_days,
      initialPaymentRules: initRules.map(i => ({
        level: i.level,
        modality: i.modality,
        extraInstallments: i.extra_installments,
        initialPctRequired: Number(i.initial_pct_required),
      })),
      levelConfigs,
    };
  }

  // ── Helper: convierte un LevelConfigModel a ActiveLevelConfigHeader ──────

  private async buildLevelConfigHeader(lc: LevelConfigModel): Promise<ActiveLevelConfigHeader> {
    const rateRules = await LevelRateRuleModel.findAll({
      where: { level_config_id: lc.id },
      order: [['payment_count', 'ASC']],
    });
    return {
      id: lc.id,
      levelScope: lc.level_scope,
      isActive: lc.is_active,
      validFrom: lc.valid_from,
      validTo: lc.valid_to,
      maxPaymentsSinInteres: lc.max_payments_sin_interes,
      maxPaymentsConInteres: lc.max_payments_con_interes,
      createdBy: lc.created_by,
      createdAt: lc.created_at,
      rateRules: rateRules.map(rr => ({
        id: rr.id,
        paymentCount: rr.payment_count,
        rateMonthly: Number(rr.rate_monthly),
      })),
    };
  }

  // ── CRUD temporal de level_configs ───────────────────────────────────────

  async findLevelConfigsByVersion(parameterVersionId: string): Promise<ActiveLevelConfigHeader[]> {
    const configs = await LevelConfigModel.findAll({
      where: { parameter_version_id: parameterVersionId },
      order: [['valid_from', 'DESC'], ['level_scope', 'ASC']],
    });
    return Promise.all(configs.map(lc => this.buildLevelConfigHeader(lc)));
  }

  async createLevelConfig(data: CreateLevelConfigData): Promise<ActiveLevelConfigHeader> {
    const sequelize = Database.getInstance().getSequelize();
    const lcId = crypto.randomUUID();

    await sequelize.transaction(async (t) => {
      // SELECT FOR UPDATE: segunda defensa (trigger BEFORE INSERT es la primera)
      const existing = await LevelConfigModel.findOne({
        where: {
          parameter_version_id: data.parameterVersionId,
          level_scope: data.levelScope,
          is_active: true,
          valid_to: null,
        },
        lock: t.LOCK.UPDATE,
        transaction: t,
      });
      if (existing) {
        throw new Error(
          `Ya existe una configuración activa para ${data.levelScope} en esta versión. ` +
          'Desactivarla primero antes de crear una nueva.',
        );
      }

      await LevelConfigModel.create(
        {
          id: lcId,
          parameter_version_id: data.parameterVersionId,
          level_scope: data.levelScope,
          is_active: true,
          valid_from: data.validFrom,
          valid_to: null,
          max_payments_sin_interes: data.maxPaymentsSinInteres,
          max_payments_con_interes: data.maxPaymentsConInteres,
          created_by: data.createdBy,
        },
        { transaction: t },
      );

      for (const rr of data.rateRules) {
        await LevelRateRuleModel.create(
          {
            id: crypto.randomUUID(),
            level_config_id: lcId,
            payment_count: rr.paymentCount,
            rate_monthly: rr.rateMonthly,
          },
          { transaction: t },
        );
      }
    });

    SequelizeParameterVersionRepository.invalidateActiveCache();

    const created = await LevelConfigModel.findByPk(lcId);
    if (!created) throw new Error('No se pudo recuperar la configuración creada');
    return this.buildLevelConfigHeader(created);
  }

  async deactivateLevelConfig(id: string): Promise<ActiveLevelConfigHeader | null> {
    const lc = await LevelConfigModel.findByPk(id);
    if (!lc || !lc.is_active) return null;

    const today = SequelizeParameterVersionRepository.todayInColombia();
    await lc.update({ is_active: false, valid_to: today });
    SequelizeParameterVersionRepository.invalidateActiveCache();
    return this.buildLevelConfigHeader(lc);
  }

  async reactivateLevelConfig(
    previousId: string,
    data: ReactivateLevelConfigData,
  ): Promise<ActiveLevelConfigHeader> {
    const previous = await LevelConfigModel.findByPk(previousId);
    if (!previous) throw new Error(`Configuración con id '${previousId}' no encontrada`);
    if (previous.is_active) {
      throw new Error(
        'La configuración anterior aún está activa. Desactivarla primero antes de reactivar.',
      );
    }

    const sequelize = Database.getInstance().getSequelize();
    const lcId = crypto.randomUUID();

    await sequelize.transaction(async (t) => {
      // Verificar que no haya otro activo para este (version, levelScope)
      const existing = await LevelConfigModel.findOne({
        where: {
          parameter_version_id: previous.parameter_version_id,
          level_scope: previous.level_scope,
          is_active: true,
          valid_to: null,
        },
        lock: t.LOCK.UPDATE,
        transaction: t,
      });
      if (existing) {
        throw new Error(
          `Ya existe una configuración activa para ${previous.level_scope}. ` +
          'No es posible reactivar mientras exista otra activa.',
        );
      }

      await LevelConfigModel.create(
        {
          id: lcId,
          parameter_version_id: previous.parameter_version_id,
          level_scope: previous.level_scope,
          is_active: true,
          valid_from: data.validFrom,
          valid_to: null,
          max_payments_sin_interes: data.maxPaymentsSinInteres,
          max_payments_con_interes: data.maxPaymentsConInteres,
          created_by: data.createdBy,
        },
        { transaction: t },
      );

      for (const rr of data.rateRules) {
        await LevelRateRuleModel.create(
          {
            id: crypto.randomUUID(),
            level_config_id: lcId,
            payment_count: rr.paymentCount,
            rate_monthly: rr.rateMonthly,
          },
          { transaction: t },
        );
      }
    });

    SequelizeParameterVersionRepository.invalidateActiveCache();

    const created = await LevelConfigModel.findByPk(lcId);
    if (!created) throw new Error('No se pudo recuperar la configuración reactivada');
    return this.buildLevelConfigHeader(created);
  }

  async updateLevelRateRule(
    configId: string,
    paymentCount: number,
    newRate: number,
  ): Promise<{ id: string; paymentCount: number; rateMonthly: number } | null> {
    const rule = await LevelRateRuleModel.findOne({
      where: { level_config_id: configId, payment_count: paymentCount },
    });
    if (!rule) return null;

    await rule.update({ rate_monthly: newRate });
    SequelizeParameterVersionRepository.invalidateActiveCache();
    return {
      id: rule.id,
      paymentCount: rule.payment_count,
      rateMonthly: Number(rule.rate_monthly),
    };
  }
}
