// ============================================================
// Sequelize Model: LevelConfigModel  (v2 — cabecera)
// HU-PV-01: Configuración por nivel académico.
//
// DISEÑO v2:
//   - Una fila = un período de vigencia de la configuración
//     de un nivel dentro de una versión de parámetros.
//   - Historial temporal: desactivar = cerrar valid_to,
//     reactivar = nueva fila. NUNCA sobrescribir histórico.
//   - Las tasas por número de pagos se almacenan en la tabla
//     hija LevelRateRuleModel (level_rate_rules).
// ============================================================

import { DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import { Database } from '../../config/database';

interface LevelConfigAttributes {
  id: string;
  parameter_version_id: string;
  level_scope: 'PREGRADO' | 'POSGRADO' | 'UPB_Tech';
  is_active: boolean;
  valid_from: string;                  // DATEONLY "YYYY-MM-DD"
  valid_to: string | null;             // NULL = vigente. Al desactivar: fecha de cierre.
  max_payments_sin_interes: number;    // Máx. cuotas sin interés. Negocio: 1..3.
  max_payments_con_interes: number;    // Máx. cuotas con interés. Negocio: 1..6.
  // min_initial_pct NO va aquí — fuente única: initial_payment_rules.initial_pct_required
  created_by: string;                  // FK → users.id (admin que creó este período)
  created_at: Date;
  updated_at: Date;
}

type LevelConfigCreation = Optional<LevelConfigAttributes, 'id' | 'valid_to' | 'max_payments_sin_interes' | 'max_payments_con_interes' | 'created_at' | 'updated_at'>;

export class LevelConfigModel
  extends Model<LevelConfigAttributes, LevelConfigCreation>
  implements LevelConfigAttributes
{
  declare id: string;
  declare parameter_version_id: string;
  declare level_scope: 'PREGRADO' | 'POSGRADO' | 'UPB_Tech';
  declare is_active: boolean;
  declare valid_from: string;
  declare valid_to: string | null;
  declare max_payments_sin_interes: number;
  declare max_payments_con_interes: number;
  declare created_by: string;
  declare created_at: Date;
  declare updated_at: Date;
}

const sequelize = Database.getInstance().getSequelize();

LevelConfigModel.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    parameter_version_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    level_scope: {
      type: DataTypes.ENUM('PREGRADO', 'POSGRADO', 'UPB_Tech'),
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    valid_from: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    valid_to: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: null,
    },
    max_payments_sin_interes: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 3,
    },
    max_payments_con_interes: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 6,
    },
    created_by: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'level_configs',
    timestamps: false,
  },
);
