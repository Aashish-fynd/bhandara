import { getDBConnection } from "@connections/db";
import { DataTypes, Model } from "sequelize";
import { getUUIDv7 } from "@helpers";
const sequelize = getDBConnection();
export class SearchResult extends Model {
}
export const SEARCH_RESULTS_TABLE_NAME = "SearchResults";
SearchResult.init({
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: () => getUUIDv7(),
    },
    type: {
        type: DataTypes.ENUM('event', 'user', 'tag'),
        allowNull: false,
    },
    title: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    imageUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    metadata: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
    },
    relevanceScore: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    sequelize,
    tableName: SEARCH_RESULTS_TABLE_NAME,
    timestamps: true,
    paranoid: true,
});
export default SearchResult;
//# sourceMappingURL=model.js.map