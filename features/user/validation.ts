import { validateSchema } from "@/helpers/validations";
import { USER_TABLE_NAME } from "./constants";
const createSchema = {
  type: "object",
  properties: {
    name: {
      type: "string",
      pattern: "^.+$",
      minLength: 5,
      maxLength: 50,
      errorMessage: "Name must be a valid string"
    },
    email: {
      type: "string",
      format: "email",
      errorMessage: "Email must be a valid email address"
    },
    gender: { type: "string", errorMessage: "Gender must be a valid string" },
    address: {
      type: ["object", "null"],
      additionalProperties: true,
      errorMessage: "Address must be an object or null"
    },
    isVerified: {
      type: "boolean",
      errorMessage: "isVerified must be a boolean value"
    }
  },
  required: ["name", "email", "gender"],
  additionalProperties: false,
  errorMessage: {
    type: "User data must be an object",
    required: {
      name: "Name is required",
      email: "Email is required",
      gender: "Gender is required"
    }
  }
};
const updateSchema = {
  type: "object",
  properties: {
    name: {
      type: "string",
      pattern: "^.+$",
      minLength: 5,
      maxLength: 50,
      errorMessage: "Name must be a valid string"
    },
    address: {
      type: ["object", "null"],
      additionalProperties: true,
      errorMessage: "Address must be an object or null"
    },
    isVerified: {
      type: "boolean",
      errorMessage: "isVerified must be a boolean value"
    }
  },
  additionalProperties: false,
  errorMessage: {
    type: "User data must be an object"
  }
};

const validateUserCreate = validateSchema(`${USER_TABLE_NAME}_CREATE`, createSchema);
const validateUserUpdate = validateSchema(`${USER_TABLE_NAME}_UPDATE`, updateSchema);

export { validateUserCreate, validateUserUpdate };
