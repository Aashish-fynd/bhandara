import { getDBConnection } from "@connections/db";
import { DataTypes, Model } from "sequelize";
import { getUUIDv7 } from "@helpers";
import { TAG_TABLE_NAME } from "./constants";
import { ITag } from "@/definitions/types";
type TagAttributes = Omit<ITag, "createdAt" | "updatedAt" | "deletedAt">;

export class Tag extends Model<TagAttributes, TagAttributes> {}

Tag.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => getUUIDv7(),
    },
    name: { type: DataTypes.TEXT, allowNull: false },
    value: { type: DataTypes.TEXT, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT },
    icon: { type: DataTypes.TEXT },
    color: { type: DataTypes.TEXT },
    parentId: {
      type: DataTypes.UUID,
      references: { model: "Tags", key: "id" },
    },
    createdBy: {
      type: DataTypes.UUID,
      references: { model: "Users", key: "id" },
    },
  },
  {
    modelName: "Tag",
    tableName: TAG_TABLE_NAME,
    sequelize: getDBConnection(),
    timestamps: true,
    paranoid: true,
  }
);

(async () => {
  await Tag.sync({ alter: false });
})();
