import { validateSchema } from "@/helpers/validations";
import ThreadsService from "./service";
import { EAccessLevel, EThreadType } from "@/definitions/enums";

export const threadSchema = {
  type: "object",
  properties: {
    type: {
      type: "string",
      enum: Object.values(EThreadType),
      errorMessage: `Type must be either ${Object.values(EThreadType).join(",")}`
    },
    status: {
      type: "string",
      enum: Object.values(EAccessLevel),
      errorMessage: `Status must be one of ${Object.values(EThreadType).join(",")}`
    },
    visibility: {
      type: "string",
      enum: Object.values(EAccessLevel),
      errorMessage: `Visibility must be one of ${Object.values(EAccessLevel).join(",")}`
    },
    lockHistory: {
      type: "object",
      properties: {
        lockedBy: {
          type: "string",
          format: "uuid",
          errorMessage: "LockedBy must be a valid UUID"
        },
        lockedAt: {
          type: "string",
          format: "date-time",
          errorMessage: "LockedAt must be a valid date-time"
        }
      },
      required: ["lockedBy", "lockedAt"],
      additionalProperties: false,
      errorMessage: "Each lock event must have 'lockedBy' and 'lockedAt'"
    }
  },
  required: ["type", "status", "visibility"],
  additionalProperties: false,
  errorMessage: {
    type: "Thread data must be an object",
    required: {
      type: "Type is required",
      status: "Status is required",
      visibility: "Visibility is required"
    }
  }
};

export const updateSchema = {
  type: "object",
  properties: {
    status: {
      type: "string",
      enum: Object.values(EAccessLevel),
      errorMessage: `Status must be one of ${Object.values(EThreadType).join(",")}`
    },
    visibility: {
      type: "string",
      enum: Object.values(EAccessLevel),
      errorMessage: `Visibility must be one of ${Object.values(EAccessLevel).join(",")}`
    },
    lockHistory: {
      type: "object",
      properties: {
        lockedBy: {
          type: "string",
          format: "uuid",
          errorMessage: "LockedBy must be a valid UUID"
        },
        lockedAt: {
          type: "string",
          format: "date-time",
          errorMessage: "LockedAt must be a valid date-time"
        }
      },
      required: ["lockedBy", "lockedAt"],
      additionalProperties: false,
      errorMessage: "Each lock event must have 'lockedBy' and 'lockedAt'"
    }
  },
  additionalProperties: false,
  errorMessage: {
    type: "Thread data must be an object"
  }
};

const validateThreadCreate = validateSchema(
  `${ThreadsService.TABLE_NAME}_CREATE`,
  threadSchema
);

const validateThreadUpdate = validateSchema(
  `${ThreadsService.TABLE_NAME}_UPDATE`,
  updateSchema
);

export { validateThreadCreate, validateThreadUpdate };
