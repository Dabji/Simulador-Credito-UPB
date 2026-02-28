// ============================================================
// Sequelize Model: PasswordResetTokenModel
// Tokens de recuperación de contraseña.
// ============================================================

import { DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import { Database } from '../../config/database';

interface PasswordResetTokenAttributes {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

type PasswordResetTokenCreationAttributes = Optional<PasswordResetTokenAttributes, 'used' | 'created_at'>;

export class PasswordResetTokenModel
  extends Model<PasswordResetTokenAttributes, PasswordResetTokenCreationAttributes>
  implements PasswordResetTokenAttributes
{
  declare id: string;
  declare user_id: string;
  declare token: string;
  declare expires_at: Date;
  declare used: boolean;
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
    token: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
  },
);
