import { validateSchema } from "@/helpers";
import { MEDIA_TABLE_NAME } from "./constants";
const mediaStorageSchema = {
  type: "object",
  properties: {
    provider: {
      type: "string",
      enum: ["local", "s3", "gcs", "cloudinary", "supabase"],
      errorMessage:
        "Provider must be one of 'local', 's3', 'gcs', 'cloudinary', or 'supabase'",
    },
    path: { type: "string", errorMessage: "Path must be a valid string" },
    metadata: {
      type: "object",
      additionalProperties: true,
      errorMessage: "Metadata must be an object",
    },
  },
  required: ["provider", "path", "metadata"],
  additionalProperties: false,
  errorMessage: {
    type: "Media storage data must be an object",
    required: {
      provider: "Provider is required",
      path: "Path is required",
      metadata: "Metadata is required",
    },
  },
};

const mediaSchema = {
  type: "object",
  properties: {
    fileUri: {
      type: "string",
      format: "uri",
      errorMessage: "File URI must be a valid URI",
    },
    uploadPath: {
      type: "string",
      errorMessage: "Upload path must be a valid string",
    },
    bucket: {
      type: "string",
      errorMessage: "Bucket must be a valid string",
    },
    mimeType: {
      type: ["string", "null"],
      errorMessage: "MIME type must be a string or null",
    },
    options: {
      type: "object",
      additionalProperties: true,
      properties: {
        type: {
          type: "string",
          enum: ["image", "video", "audio", "document"],
          errorMessage:
            "Type must be one of 'image', 'video', 'audio', or 'document'",
        },
        caption: {
          type: ["string", "null"],
          errorMessage: "Caption must be a string or null",
        },
        thumbnail: {
          type: ["string", "null"],
          errorMessage: "Thumbnail must be a string or null",
        },
        size: {
          type: ["integer", "null"],
          minimum: 0,
          errorMessage: "Size must be a non-negative integer or null",
        },
        duration: {
          type: ["integer", "null"],
          minimum: 0,
          errorMessage: "Duration must be a non-negative integer or null",
        },
        uploader: {
          type: "string",
          format: "uuid",
          errorMessage: "Uploader must be a valid UUID",
        },
        accessLevel: {
          type: "string",
          enum: ["public", "private", "restricted"],
          errorMessage:
            "Access level must be one of 'public', 'private', or 'restricted'",
        },
        metadata: {
          type: ["object", "null"],
          additionalProperties: true,
          errorMessage: "Metadata must be an object or null",
        },
      },
    },
  },
  required: ["type", "url", "uploader", "storage", "accessLevel", "metadata"],
  additionalProperties: false,
  errorMessage: {
    type: "Media data must be an object",
    required: {
      type: "Type is required",
      url: "URL is required",
      uploader: "Uploader is required",
      storage: "Storage is required",
      accessLevel: "Access level is required",
      metadata: "Metadata is required",
    },
  },
};

const updateSchema = {
  type: "object",
  properties: {
    caption: {
      type: ["string", "null"],
      errorMessage: "Caption must be a string or null",
    },
    thumbnail: {
      type: ["string", "null"],
      errorMessage: "Thumbnail must be a string or null",
    },
    mimeType: {
      type: ["string", "null"],
      errorMessage: "MIME type must be a string or null",
    },
    accessLevel: {
      type: "string",
      enum: ["public", "private", "restricted"],
      errorMessage:
        "Access level must be one of 'public', 'private', or 'restricted'",
    },
    metadata: {
      type: "object",
      additionalProperties: true,
      errorMessage: "Metadata must be an object",
    },
  },
  additionalProperties: false,
  errorMessage: {
    type: "Media data must be an object",
  },
};

const validateMediaCreate = validateSchema(
  `${MEDIA_TABLE_NAME}_CREATE`,
  mediaSchema
);
const validateMediaUpdate = validateSchema(
  `${MEDIA_TABLE_NAME}_UPDATE`,
  updateSchema
);

export { validateMediaCreate, validateMediaUpdate };
