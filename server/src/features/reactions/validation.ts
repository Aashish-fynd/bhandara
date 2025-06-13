import { validateSchema } from "@/helpers";
import { REACTION_TABLE_NAME, COMMON_EMOJIS, ALLOWED_REACTION_TABLES } from "./constants";

const basePattern = `^(${ALLOWED_REACTION_TABLES.join("|")})\\/[0-9a-fA-F-]{36}$`;

const reactionSchema = {
  type: "object",
  properties: {
    contentId: {
      type: "string",
      pattern: basePattern,
      errorMessage: `contentId must be of the form '<table>/<uuid>' where table is one of ${ALLOWED_REACTION_TABLES.join(", ")}`,
    },
    emoji: {
      type: "string",
      enum: COMMON_EMOJIS,
      errorMessage: "emoji must be one of the supported emojis",
    },
    userId: {
      type: "string",
      format: "uuid",
      errorMessage: "userId must be a valid UUID",
    },
  },
  required: ["contentId", "emoji", "userId"],
  additionalProperties: false,
  errorMessage: {
    type: "Reaction data must be an object",
    required: {
      contentId: "contentId is required",
      emoji: "emoji is required",
      userId: "userId is required",
    },
  },
};

const updateSchema = {
  type: "object",
  properties: {
    contentId: {
      type: "string",
      pattern: basePattern,
      errorMessage: `contentId must be of the form '<table>/<uuid>' where table is one of ${ALLOWED_REACTION_TABLES.join(", ")}`,
    },
    emoji: {
      type: "string",
      enum: COMMON_EMOJIS,
      errorMessage: "emoji must be one of the supported emojis",
    },
    userId: {
      type: "string",
      format: "uuid",
      errorMessage: "userId must be a valid UUID",
    },
  },
  additionalProperties: false,
  errorMessage: {
    type: "Reaction data must be an object",
  },
};

export const validateReactionCreate = validateSchema(
  `${REACTION_TABLE_NAME}_CREATE`,
  reactionSchema
);

export const validateReactionUpdate = validateSchema(
  `${REACTION_TABLE_NAME}_UPDATE`,
  updateSchema
);

