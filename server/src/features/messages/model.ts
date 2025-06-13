import { getDBConnection } from "@connections/db";
import { DataTypes, Model } from "sequelize";
import { getUUIDv7 } from "@helpers";
import { MESSAGE_TABLE_NAME } from "./constants";

export class Message extends Model {}

Message.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: () => getUUIDv7() },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "Users", key: "id" },
    },
    parentId: {
      type: DataTypes.UUID,
      references: { model: "Messages", key: "id" },
    },
    content: { type: DataTypes.JSONB, allowNull: false },
    isEdited: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    threadId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "Threads", key: "id" },
    },
  },
  {
    modelName: "Message",
    tableName: MESSAGE_TABLE_NAME,
    sequelize: getDBConnection(),
    timestamps: true,
    paranoid: true,
  }
);

(async () => {
  await Message.sync({ alter: true });
})();
