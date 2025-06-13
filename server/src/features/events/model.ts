import { getDBConnection } from "@connections/db";
import { EEventStatus, EEventType } from "@definitions/enums";
import { getUUIDv7 } from "@helpers";
import { DataTypes, Model } from "sequelize";

export class Event extends Model {}

export const EVENT_TABLE_NAME = "Events";

Event.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => getUUIDv7(),
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    location: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    participants: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    verifiers: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    type: {
      type: DataTypes.ENUM(...Object.values(EEventType)),
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM(...Object.values(EEventStatus)),
      allowNull: false,
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tags: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    media: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    modelName: "Event",
    tableName: EVENT_TABLE_NAME,
    sequelize: getDBConnection(),
    timestamps: true,
    paranoid: true,
  }
);

(async () => {
  await Event.sync({ alter: true });
})();
