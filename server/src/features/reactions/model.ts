import { getDBConnection } from "@connections/db";
import { DataTypes, Model } from "sequelize";
import { getUUIDv7 } from "@helpers";
import { REACTION_TABLE_NAME } from "./constants";

export class Reaction extends Model {}

Reaction.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => getUUIDv7(),
    },
    contentId: { type: DataTypes.TEXT, allowNull: false },
    emoji: { type: DataTypes.TEXT, allowNull: false },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "Users", key: "id" },
    },
  },
  {
    modelName: "Reaction",
    tableName: REACTION_TABLE_NAME,
    sequelize: getDBConnection(),
    timestamps: true,
    paranoid: true,
    indexes: [{ fields: ["contentId"] }],
  }
);

(async () => {
  await Reaction.sync({ alter: true });
})();
