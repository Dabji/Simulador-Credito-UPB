// ============================================================
// Seed: Carga los parámetros institucionales del semestre 2026-01
// en las tablas parameter_versions e initial_payment_rules.
//
// Ejecutar: npx ts-node src/seeds/seedParameters.ts
// ============================================================

import path from 'path';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
dotenv.config({ path: path.resolve(process.cwd(), '..', '.env') });

import { Database } from '../Infrastructure/config/database';
import { UserModel } from '../Infrastructure/persistence/models/UserModel';
import type { DocumentTypeDB } from '../Infrastructure/persistence/models/UserModel';
import { ParameterVersionModel } from '../Infrastructure/persistence/models/ParameterVersionModel';
import { InitialPaymentRuleModel } from '../Infrastructure/persistence/models/InitialPaymentRuleModel';

type InitialPaymentLevel = 'PREGRADO' | 'POSGRADO' | 'UPB_Tech';
type InitialPaymentModality = 'SIN_INTERES' | 'CON_INTERES';

interface InstallmentRule {
  readonly extra: number;
  readonly pct: number;
}

interface RuleSetByModality {
  readonly SIN_INTERES: readonly InstallmentRule[];
  readonly CON_INTERES: readonly InstallmentRule[];
}

interface InitialPaymentSeedRule extends InstallmentRule {
  readonly level: InitialPaymentLevel;
  readonly modality: InitialPaymentModality;
}

const PAYMENT_LEVELS: readonly InitialPaymentLevel[] = ['PREGRADO', 'POSGRADO', 'UPB_Tech'];
const PAYMENT_MODALITIES: readonly InitialPaymentModality[] = ['SIN_INTERES', 'CON_INTERES'];

function toInstallmentRules(percentages: readonly number[]): readonly InstallmentRule[] {
  return percentages.map((pct, extra) => ({ extra, pct }));
}

function buildInitialPaymentData(
  rulesByLevel: Readonly<Record<InitialPaymentLevel, RuleSetByModality>>,
): readonly InitialPaymentSeedRule[] {
  const rows: InitialPaymentSeedRule[] = [];

  for (const level of PAYMENT_LEVELS) {
    for (const modality of PAYMENT_MODALITIES) {
      for (const rule of rulesByLevel[level][modality]) {
        rows.push({
          level,
          modality,
          extra: rule.extra,
          pct: rule.pct,
        });
      }
    }
  }

  return rows;
}

async function seed(): Promise<void> {
  const db = Database.getInstance();
  await db.connect();

  const sequelize = db.getSequelize();
  const adminDocumentType: DocumentTypeDB = 'CC';

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
          id: randomUUID(),
          email: 'admin@upb.edu.co',
          password: passwordHash,
          first_name: 'Admin',
          last_name: 'Sistema',
          document_type: adminDocumentType,
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
    const versionId = randomUUID();

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

    // ── 2. Reglas de cuota inicial (formato AF-FO-318-B) ─────
    // Cada fila es una combinación válida de distribución de pagos.
    //
    // Ejemplo para PREGRADO SIN_INTERES:
    //   - extra_installments=0: cuota inicial 100% (pago total)
    //   - extra_installments=1: cuota inicial 50%
    //   - extra_installments=2: cuota inicial 33.33%
    //   - extra_installments=3: cuota inicial 20%
    //
    // Para CON_INTERES, se permiten hasta 6 cuotas extras.
    // El índice del porcentaje corresponde a extra_installments:
    // [1.0, 0.5, 0.34] -> extras 0, 1 y 2 respectivamente.
    const academicLevelRules: RuleSetByModality = {
      SIN_INTERES: toInstallmentRules([1.0000, 0.5000, 0.3400, 0.2000]),
      CON_INTERES: toInstallmentRules([1.0000, 0.5000, 0.3400, 0.2500, 0.2000, 0.2000, 0.2000]),
    };

    const rulesByLevel: Readonly<Record<InitialPaymentLevel, RuleSetByModality>> = {
      PREGRADO: academicLevelRules,
      POSGRADO: academicLevelRules,
      UPB_Tech: {
        SIN_INTERES: toInstallmentRules([1.0000, 0.5000, 0.3400, 0.1500]),
        CON_INTERES: toInstallmentRules([1.0000, 0.5000, 0.3400, 0.2500, 0.2000, 0.1500, 0.1500]),
      },
    };

    const initialPaymentData = buildInitialPaymentData(rulesByLevel);

    for (const rule of initialPaymentData) {
      await InitialPaymentRuleModel.create(
        {
          id: randomUUID(),
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
