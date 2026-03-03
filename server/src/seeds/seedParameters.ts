// ============================================================
// Seed: Carga los parámetros institucionales del semestre 2026-01
// en las tablas parameter_versions, interest_rates,
// modality_rules e initial_payment_rules.
//
// Ejecutar: npx ts-node src/seeds/seedParameters.ts
// ============================================================

import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
dotenv.config({ path: path.resolve(process.cwd(), '..', '.env') });

import { Database } from '../Infrastructure/config/database';
import { UserModel } from '../Infrastructure/persistence/models/UserModel';
import { ParameterVersionModel } from '../Infrastructure/persistence/models/ParameterVersionModel';
import { InterestRateModel } from '../Infrastructure/persistence/models/InterestRateModel';
import { ModalityRuleModel } from '../Infrastructure/persistence/models/ModalityRuleModel';
import { InitialPaymentRuleModel } from '../Infrastructure/persistence/models/InitialPaymentRuleModel';

async function seed(): Promise<void> {
  const db = Database.getInstance();
  await db.connect();

  const sequelize = db.getSequelize();

  await sequelize.transaction(async (t) => {
    // ── 0. Obtener o crear usuario ADMIN (para FK created_by) ──
    let admin = await UserModel.findOne({ where: { role: 'ADMIN' }, transaction: t });
    if (!admin) {
      const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD;
      if (!defaultPassword) {
        throw new Error(
          'La variable de entorno ADMIN_DEFAULT_PASSWORD es obligatoria para crear el usuario ADMIN. ' +
          'Defínela en tu archivo .env antes de ejecutar el seed.',
        );
      }
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      admin = await UserModel.create(
        {
          id: crypto.randomUUID(),
          email: 'admin@upb.edu.co',
          password: passwordHash,
          first_name: 'Admin',
          last_name: 'Sistema',
          document_number: '0000000000',
          role: 'ADMIN',
          is_active: true,
        },
        { transaction: t },
      );
      console.log('✅ Usuario ADMIN creado (con contraseña):', admin.id);
    } else {
      console.log('✅ Usuario ADMIN encontrado:', admin.id);
    }

    // ── 1. Versión de parámetros ─────────────────────────────
    // Periodo 2026-01: Dic 2025 → May 2026
    // Ventana de cuotas: Ene 1 → Jun 30 del 2026
    const versionId = crypto.randomUUID();

    await ParameterVersionModel.create(
      {
        id: versionId,
        valid_from: '2025-12-01',
        valid_to: '2026-05-31',
        notes: 'Semestre 2026-01 — parámetros iniciales AF-FO-318-B',
        installments_window_from: '2026-01-01',
        installments_window_to: '2026-06-30',
        payment_period_days: 30,
        created_by: admin.id, // FK → users.id
      },
      { transaction: t },
    );

    console.log(`✅ parameter_versions: ${versionId}`);

    // ── 2. Tasas de interés por nivel ────────────────────────
    // Según HU-13: 0.9% MV para con_interes (igual para todos los niveles)
    const levels = ['PREGRADO', 'POSGRADO', 'UPB_TEC'] as const;

    for (const level of levels) {
      await InterestRateModel.create(
        {
          id: crypto.randomUUID(),
          rate_monthly: 0.009,       // 0.9% mensual vencido
          rate_type: 'MV',
          level_scope: level,
          parameter_version_id: versionId,
        },
        { transaction: t },
      );
    }
    console.log('✅ interest_rates: 3 filas (PREGRADO, POSGRADO, UPB_TEC) @ 0.9% MV');

    // ── 3. Reglas de modalidad ───────────────────────────────
    // Según HU-13 y formato AF-FO-318-B:
    // SIN_INTERES → máx 3 cuotas, cuota inicial mínima según nivel
    // CON_INTERES → máx 6 cuotas, cuota inicial mínima según nivel
    const modalityData = [
      // PREGRADO
      { modality: 'SIN_INTERES', level: 'PREGRADO',  maxPay: 3, minPct: 0.2000 },
      { modality: 'CON_INTERES', level: 'PREGRADO',  maxPay: 6, minPct: 0.2000 },
      // POSGRADO
      { modality: 'SIN_INTERES', level: 'POSGRADO',  maxPay: 3, minPct: 0.2000 },
      { modality: 'CON_INTERES', level: 'POSGRADO',  maxPay: 6, minPct: 0.2000 },
      // UPB_TEC
      { modality: 'SIN_INTERES', level: 'UPB_TEC',   maxPay: 3, minPct: 0.1500 },
      { modality: 'CON_INTERES', level: 'UPB_TEC',   maxPay: 6, minPct: 0.1500 },
    ] as const;

    for (const rule of modalityData) {
      await ModalityRuleModel.create(
        {
          id: crypto.randomUUID(),
          modality: rule.modality,
          level: rule.level,
          max_total_payments: rule.maxPay,
          min_initial_pct: rule.minPct,
          parameter_version_id: versionId,
        },
        { transaction: t },
      );
    }
    console.log('✅ modality_rules: 6 filas (2 modalidades × 3 niveles)');

    // ── 4. Reglas de cuota inicial (formato AF-FO-318-B) ─────
    // Cada fila es una combinación válida de distribución de pagos.
    //
    // Ejemplo para PREGRADO SIN_INTERES:
    //   - extra_installments=0: cuota inicial 100% (pago total)
    //   - extra_installments=1: cuota inicial 50%
    //   - extra_installments=2: cuota inicial 33.33%
    //   - extra_installments=3: cuota inicial 20%
    //
    // Para CON_INTERES, se permiten hasta 6 cuotas extras.

    const initialPaymentData = [
      // ─── PREGRADO ───
      { level: 'PREGRADO', modality: 'SIN_INTERES', extra: 0, pct: 1.0000 },
      { level: 'PREGRADO', modality: 'SIN_INTERES', extra: 1, pct: 0.5000 },
      { level: 'PREGRADO', modality: 'SIN_INTERES', extra: 2, pct: 0.3400 },
      { level: 'PREGRADO', modality: 'SIN_INTERES', extra: 3, pct: 0.2000 },
      { level: 'PREGRADO', modality: 'CON_INTERES', extra: 0, pct: 1.0000 },
      { level: 'PREGRADO', modality: 'CON_INTERES', extra: 1, pct: 0.5000 },
      { level: 'PREGRADO', modality: 'CON_INTERES', extra: 2, pct: 0.3400 },
      { level: 'PREGRADO', modality: 'CON_INTERES', extra: 3, pct: 0.2500 },
      { level: 'PREGRADO', modality: 'CON_INTERES', extra: 4, pct: 0.2000 },
      { level: 'PREGRADO', modality: 'CON_INTERES', extra: 5, pct: 0.2000 },
      { level: 'PREGRADO', modality: 'CON_INTERES', extra: 6, pct: 0.2000 },
      // ─── POSGRADO ───
      { level: 'POSGRADO', modality: 'SIN_INTERES', extra: 0, pct: 1.0000 },
      { level: 'POSGRADO', modality: 'SIN_INTERES', extra: 1, pct: 0.5000 },
      { level: 'POSGRADO', modality: 'SIN_INTERES', extra: 2, pct: 0.3400 },
      { level: 'POSGRADO', modality: 'SIN_INTERES', extra: 3, pct: 0.2000 },
      { level: 'POSGRADO', modality: 'CON_INTERES', extra: 0, pct: 1.0000 },
      { level: 'POSGRADO', modality: 'CON_INTERES', extra: 1, pct: 0.5000 },
      { level: 'POSGRADO', modality: 'CON_INTERES', extra: 2, pct: 0.3400 },
      { level: 'POSGRADO', modality: 'CON_INTERES', extra: 3, pct: 0.2500 },
      { level: 'POSGRADO', modality: 'CON_INTERES', extra: 4, pct: 0.2000 },
      { level: 'POSGRADO', modality: 'CON_INTERES', extra: 5, pct: 0.2000 },
      { level: 'POSGRADO', modality: 'CON_INTERES', extra: 6, pct: 0.2000 },
      // ─── UPB_TEC ───
      { level: 'UPB_TEC', modality: 'SIN_INTERES', extra: 0, pct: 1.0000 },
      { level: 'UPB_TEC', modality: 'SIN_INTERES', extra: 1, pct: 0.5000 },
      { level: 'UPB_TEC', modality: 'SIN_INTERES', extra: 2, pct: 0.3400 },
      { level: 'UPB_TEC', modality: 'SIN_INTERES', extra: 3, pct: 0.1500 },
      { level: 'UPB_TEC', modality: 'CON_INTERES', extra: 0, pct: 1.0000 },
      { level: 'UPB_TEC', modality: 'CON_INTERES', extra: 1, pct: 0.5000 },
      { level: 'UPB_TEC', modality: 'CON_INTERES', extra: 2, pct: 0.3400 },
      { level: 'UPB_TEC', modality: 'CON_INTERES', extra: 3, pct: 0.2500 },
      { level: 'UPB_TEC', modality: 'CON_INTERES', extra: 4, pct: 0.2000 },
      { level: 'UPB_TEC', modality: 'CON_INTERES', extra: 5, pct: 0.1500 },
      { level: 'UPB_TEC', modality: 'CON_INTERES', extra: 6, pct: 0.1500 },
    ] as const;

    for (const rule of initialPaymentData) {
      await InitialPaymentRuleModel.create(
        {
          id: crypto.randomUUID(),
          level: rule.level,
          modality: rule.modality,
          extra_installments: rule.extra,
          initial_pct_required: rule.pct,
          parameter_version_id: versionId,
        },
        { transaction: t },
      );
    }
    console.log(`✅ initial_payment_rules: ${initialPaymentData.length} filas`);
  });

  console.log('\n🎉 Seed completado exitosamente.');
  await db.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
