import { getDBConnection } from "@connections/db";
import { DataTypes, Model } from "sequelize";
import { getUUIDv7 } from "@helpers";
import { USER_TABLE_NAME } from "./constants";

export class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => getUUIDv7(),
    },
    name: { type: DataTypes.TEXT, allowNull: false },
    email: { type: DataTypes.TEXT, allowNull: false, unique: true },
    gender: { type: DataTypes.TEXT, allowNull: false },
    address: { type: DataTypes.JSONB },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    profilePic: { type: DataTypes.JSONB },
    mediaId: {
      type: DataTypes.UUID,
      references: { model: "Media", key: "id" },
    },
    username: { type: DataTypes.TEXT },
    password: { type: DataTypes.TEXT },
    meta: { type: DataTypes.JSONB, defaultValue: {} },
  },
  {
    modelName: "User",
    tableName: USER_TABLE_NAME,
    sequelize: getDBConnection(),
    timestamps: true,
    paranoid: true,
  }
);

(async () => {
  await User.sync({ alter: false });
})();
