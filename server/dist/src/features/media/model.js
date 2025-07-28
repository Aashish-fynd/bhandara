import { getDBConnection } from "@connections/db";
import { DataTypes, Model } from "sequelize";
import { getUUIDv7 } from "@helpers";
import { MEDIA_TABLE_NAME } from "./constants";
import { EMediaType, EAccessLevel } from "@definitions/enums";
export class Media extends Model {
}
Media.init({
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: () => getUUIDv7(),
    },
    type: {
        type: DataTypes.ENUM(...Object.values(EMediaType)),
        allowNull: false,
    },
    url: { type: DataTypes.TEXT, allowNull: false },
    name: { type: DataTypes.TEXT, allowNull: false },
    caption: { type: DataTypes.TEXT },
    thumbnail: { type: DataTypes.TEXT },
    size: { type: DataTypes.INTEGER },
    mimeType: { type: DataTypes.TEXT },
    duration: { type: DataTypes.INTEGER },
    uploader: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "Users", key: "id" },
    },
    storage: { type: DataTypes.JSONB, allowNull: false },
    access: {
        type: DataTypes.ENUM(...Object.values(EAccessLevel)),
        allowNull: false,
    },
    metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
}, {
    modelName: "Media",
    tableName: MEDIA_TABLE_NAME,
    sequelize: getDBConnection(),
    timestamps: true,
    paranoid: true,
    indexes: [
        {
            name: "idx_media_url",
            fields: ["url"],
        },
    ],
});
(async () => {
    await Media.sync({ alter: false });
})();
//# sourceMappingURL=model.js.map