import { validateSchema } from "@/helpers/validations";
import MessageService from "./service";

const messageContentSchema = {
  oneOf: [
    {
      type: "object",
      properties: {
        text: { type: "string", errorMessage: "Text must be a valid string" }
      },
      required: ["text"],
      additionalProperties: false,
      errorMessage: "Plain text message must have a 'text' field"
    },
    {
      // Rich object message
      type: "object",
      properties: {
        text: {
          type: ["string", "null"],
          errorMessage: "Text must be a string or null"
        },
        images: {
          type: "array",
          items: {
            type: "string",
            format: "uri",
            errorMessage: "Each image URL must be a valid URI"
          },
          uniqueItems: true,
          errorMessage: "Images must be an array of unique URIs"
        },
        videos: {
          type: "array",
          items: {
            type: "string",
            format: "uri",
            errorMessage: "Each video URL must be a valid URI"
          },
          uniqueItems: true,
          errorMessage: "Videos must be an array of unique URIs"
        }
        // TODO: to be added later
        // links: {
        //   type: "array",
        //   items: {
        //     type: "object",
        //     properties: {
        //       url: {
        //         type: "string",
        //         format: "uri",
        //         errorMessage: "URL must be a valid URI",
        //       },
        //       title: {
        //         type: "string",
        //         errorMessage: "Title must be a valid string",
        //       },
        //     },
        //     required: ["url", "title"],
        //     additionalProperties: false,
        //     errorMessage: "Each link must have a valid 'url' and 'title'",
        //   },
        //   uniqueItems: true,
        //   errorMessage:
        //     "Links must be an array of unique objects with 'url' and 'title'",
        // },
      },
      additionalProperties: false,
      errorMessage: "Rich object message must have valid fields"
    }
  ],
  errorMessage: "Message content must be either plain text or a rich object"
};

const messageSchema = {
  type: "object",
  properties: {
    userId: {
      type: "string",
      format: "uuid",
      errorMessage: "userId must be a valid UUID"
    },
    parentId: {
      type: ["string", "null"],
      format: "uuid",
      errorMessage: "parentId must be a valid UUID or null"
    },
    content: messageContentSchema,
    isEdited: {
      type: "boolean",
      errorMessage: "isEdited must be a boolean value"
    }
  },
  required: ["userId", "content", "isEdited"],
  additionalProperties: false,
  errorMessage: {
    type: "Message data must be an object",
    required: {
      userId: "userId is required and must be a valid UUID",
      content: "Message content is required",
      isEdited: "isEdited is required"
    }
  }
};
const updateSchema = {
  type: "object",
  properties: {
    content: messageContentSchema
  },
  additionalProperties: false,
  errorMessage: {
    type: "Message data must be an object"
  }
};

const validateMessageCreate = validateSchema(
  `${MessageService.TABLE_NAME}_CREATE`,
  messageSchema
);

const validateMessageUpdate = validateSchema(
  `${MessageService.TABLE_NAME}_UPDATE`,
  updateSchema
);

export { validateMessageCreate, validateMessageUpdate };
