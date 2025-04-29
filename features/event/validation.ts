import { validateSchema } from "@/helpers/validations";
import { EVENT_TABLE_NAME } from "./constants";

const locationSchema = {
  type: "object",
  properties: {
    address: { type: "string", errorMessage: "Address must be a valid string" },
    coordinates: {
      type: "object",
      properties: {
        latitude: { type: "number", errorMessage: "Latitude must be a number" },
        longitude: {
          type: "number",
          errorMessage: "Longitude must be a number"
        }
      },
      required: ["latitude", "longitude"],
      additionalProperties: false,
      errorMessage: "Coordinates must include valid 'latitude' and 'longitude'"
    },
    venueName: {
      type: ["string", "null"],
      errorMessage: "Venue name must be a string or null"
    }
  },
  required: ["address"],
  additionalProperties: false,
  errorMessage: {
    type: "Location data must be an object",
    required: {
      address: "Address is required"
    }
  }
};

// Event Participant Schema
const participantSchema = {
  type: "object",
  properties: {
    userId: {
      type: "string",
      format: "uuid",
      errorMessage: "userId must be a valid UUID"
    },
    status: {
      type: "string",
      enum: ["confirmed", "pending", "declined"],
      errorMessage: "Status must be one of 'confirmed', 'pending', or 'declined'"
    }
  },
  required: ["userId", "status"],
  additionalProperties: false,
  errorMessage: {
    type: "Participant data must be an object",
    required: {
      userId: "userId is required and must be a valid UUID",
      status: "Status is required"
    }
  }
};

const eventSchema = {
  type: "object",
  properties: {
    name: { type: "string", errorMessage: "Name must be a valid string" },
    description: {
      type: "string",
      errorMessage: "Description must be a valid string"
    },
    location: locationSchema,
    participants: {
      type: "array",
      items: participantSchema,
      uniqueItems: true,
      errorMessage: "Participants must be an array of unique objects"
    },
    verifiers: {
      type: "array",
      items: {
        type: "string",
        format: "uuid",
        errorMessage: "Each verifier must be a valid UUID"
      },
      uniqueItems: true,
      errorMessage: "Verifiers must be an array of unique UUIDs"
    },
    threadId: {
      type: "string",
      format: "uuid",
      errorMessage: "threadId must be a valid UUID"
    },
    type: {
      type: "string",
      enum: ["organized", "custom"],
      errorMessage: "Type must be one of 'organized' or 'custom'"
    },
    createdBy: {
      type: "string",
      format: "uuid",
      errorMessage: "createdBy must be a valid UUID"
    },
    status: {
      type: "string",
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      errorMessage: "Status must be one of 'upcoming', 'ongoing', 'completed', or 'cancelled'"
    },
    capacity: {
      type: "integer",
      minimum: 0,
      errorMessage: "Capacity must be a non-negative integer"
    }
  },
  required: [
    "name",
    "description",
    "location",
    "participants",
    "verifiers",
    "threadId",
    "type",
    "createdBy",
    "status",
    "capacity"
  ],
  additionalProperties: false,
  errorMessage: {
    type: "Event data must be an object",
    required: {
      name: "Name is required",
      description: "Description is required",
      location: "Location is required",
      participants: "Participants is required",
      verifiers: "Verifiers is required",
      threadId: "threadId is required",
      type: "Type is required",
      createdBy: "createdBy is required",
      status: "Status is required",
      capacity: "Capacity is required"
    }
  }
};

const validateEventCreate = validateSchema(`${EVENT_TABLE_NAME}_CREATE`, eventSchema);

const validateEventUpdate = validateSchema(`${EVENT_TABLE_NAME}_UPDATE`, eventSchema);

export { validateEventCreate, validateEventUpdate };
