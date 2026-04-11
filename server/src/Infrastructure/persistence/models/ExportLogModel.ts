// ============================================================
// Sequelize Model: ExportLogModel
// Tabla de registro de exportaciones (PDF / CSV).
// Tabla: export_logs (HU-40, HU-41)
// ============================================================

import { DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import { Database } from '../../config/database';

interface ExportLogAttributes {
  id: string;
  format: 'PDF' | 'CSV';
  simulation_id: string;
  user_id: string;
  exported_at: Date;
  ip_address: string | null;
  file_name: string;
  content_flags: string;
}

type ExportLogCreationAttributes = Optional<
  ExportLogAttributes,
  'id' | 'exported_at' | 'ip_address'
>;

export class ExportLogModel
  extends Model<ExportLogAttributes, ExportLogCreationAttributes>
  implements ExportLogAttributes
{
  declare id: string;
  declare format: 'PDF' | 'CSV';
  declare simulation_id: string;
  declare user_id: string;
  declare exported_at: Date;
  declare ip_address: string | null;
  declare file_name: string;
  declare content_flags: string;
}

const sequelize = Database.getInstance().getSequelize();

ExportLogModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    format: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        isIn: [['PDF', 'CSV']],
      },
    },
    simulation_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    exported_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    content_flags: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '{}',
    },
  },
  {
    sequelize,
    tableName: 'export_logs',
    timestamps: false,
    indexes: [
      { fields: ['simulation_id'], name: 'idx_el_simulation' },
      { fields: ['user_id', 'exported_at'], name: 'idx_el_user_exported' },
    ],
  },
);
