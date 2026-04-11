// ============================================================
// Sequelize Model: PasswordResetTokenModel
// Tokens de recuperación de contraseña.
// Alineado con la tabla real en Aiven MySQL.
// ============================================================

import { DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import { Database } from '../../config/database';

interface PasswordResetTokenAttributes {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  requested_ip: string | null;
  user_agent: string | null;
  created_at: Date;
}

type PasswordResetTokenCreationAttributes = Optional<
  PasswordResetTokenAttributes,
  'used_at' | 'requested_ip' | 'user_agent' | 'created_at'
>;

export class PasswordResetTokenModel
  extends Model<PasswordResetTokenAttributes, PasswordResetTokenCreationAttributes>
  implements PasswordResetTokenAttributes
{
  declare id: string;
  declare user_id: string;
  declare token_hash: string;
  declare expires_at: Date;
  declare used_at: Date | null;
  declare requested_ip: string | null;
  declare user_agent: string | null;
  declare created_at: Date;
}

const sequelize = Database.getInstance().getSequelize();

PasswordResetTokenModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    token_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    requested_ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
      defaultValue: null,
    },
    user_agent: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'password_reset_tokens',
    timestamps: false,
    indexes: [
      { unique: true, fields: ['token_hash'], name: 'uq_prt_token_hash' },
      { fields: ['user_id'], name: 'idx_prt_user_id' },
      { fields: ['expires_at', 'used_at'], name: 'idx_prt_expires' },
    ],
  },
);
