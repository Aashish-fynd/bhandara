import { getDBConnection } from "@connections/db";
import { DataTypes, Model } from "sequelize";
import { getUUIDv7 } from "@helpers";
import { THREAD_TABLE_NAME } from "./constants";
import { EThreadType, EAccessLevel } from "@definitions/enums";

export class Thread extends Model {}

Thread.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => getUUIDv7(),
    },
    type: {
      type: DataTypes.ENUM(...Object.values(EThreadType)),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(EAccessLevel)),
      allowNull: false,
    },
    visibility: {
      type: DataTypes.ENUM(...Object.values(EAccessLevel)),
      allowNull: false,
    },
    parentId: {
      type: DataTypes.UUID,
      references: { model: "Threads", key: "id" },
    },
    eventId: {
      type: DataTypes.UUID,
      references: { model: "Events", key: "id" },
    },
    lockHistory: { type: DataTypes.JSONB, defaultValue: {} },
  },
  {
    modelName: "Thread",
    tableName: THREAD_TABLE_NAME,
    sequelize: getDBConnection(),
    timestamps: true,
    paranoid: true,
  }
);

(async () => {
  await Thread.sync({ alter: false });
})();
