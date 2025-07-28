import { getDBConnection } from "@connections/db";
import { EEventStatus, EEventType } from "@definitions/enums";
import { getUUIDv7 } from "@helpers";
import { DataTypes, Model } from "sequelize";
const sequelize = getDBConnection();
/**
 * Sequelize model representing an event. Complex fields like location and
 * participants are stored as JSONB columns.
 */
export class Event extends Model {
}
export const EVENT_TABLE_NAME = "Events";
Event.init({
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
        defaultValue: EEventStatus.Draft,
    },
    capacity: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
    timings: {
        type: DataTypes.JSONB,
        allowNull: false,
    },
}, {
    modelName: "Event",
    tableName: EVENT_TABLE_NAME,
    sequelize,
    timestamps: true,
    paranoid: true,
    indexes: [
        {
            name: "events_location_gix",
            using: "GIST",
            fields: [
                sequelize.literal(`ST_SetSRID(ST_MakePoint(CAST("location"->'coordinates'->>'longitude' AS DOUBLE PRECISION), CAST("location"->'coordinates'->>'latitude' AS DOUBLE PRECISION)), 4326)`),
            ],
        },
    ],
});
(async () => {
    await Event.sync({ alter: false });
})();
//# sourceMappingURL=model.js.map