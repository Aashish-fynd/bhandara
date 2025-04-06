-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE "ThreadType" AS ENUM ('discussion', 'qna');
CREATE TYPE "AccessLevel" AS ENUM ('public', 'private', 'restricted');
CREATE TYPE "MediaType" AS ENUM ('image', 'video', 'audio', 'document');
CREATE TYPE "EventType" AS ENUM ('organized', 'custom');
CREATE TYPE "EventStatus" AS ENUM ('upcoming', 'ongoing', 'completed', 'cancelled');

-- Media Table
CREATE TABLE "Media" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT NULL,
    "thumbnail" TEXT NULL,
    "size" INTEGER NULL,
    "mimeType" TEXT NULL,
    "duration" INTEGER NULL,
    "uploader" UUID NOT NULL, -- Foreign key will be added later
    "storage" JSONB NOT NULL,
    "accessLevel" "AccessLevel" NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}'::JSONB,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "deletedAt" TIMESTAMPTZ NULL -- Soft delete column
);

COMMENT ON COLUMN "Media"."storage" IS '{
"provider": "local | s3 | gcs | cloudinary | supabase", -- Media provider
"path": "string", -- Path to the file in the storage provider
"metadata": "Record<string, any>" -- Additional metadata (key-value pairs)
}';

-- User Table
CREATE TABLE "User" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "gender" TEXT NOT NULL,
    "address" JSONB,
    "isVerified" BOOLEAN NOT NULL DEFAULT FALSE,
    "profilePic" UUID NULL, -- Foreign key will be added later
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "deletedAt" TIMESTAMPTZ NULL -- Soft delete column
);

-- Add foreign key constraints for User and Media after both tables are created
ALTER TABLE "Media" ADD CONSTRAINT "Media_uploader_fkey" FOREIGN KEY ("uploader") REFERENCES "User"("id");
ALTER TABLE "User" ADD CONSTRAINT "User_profilePic_fkey" FOREIGN KEY ("profilePic") REFERENCES "Media"("id");

-- Thread Table
CREATE TABLE "Thread" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "type" "ThreadType" NOT NULL,
    "status" "AccessLevel" NOT NULL,
    "visibility" "AccessLevel" NOT NULL,
    "eventId" UUID, -- Foreign key will be added later
    "lockHistory" JSONB DEFAULT '{}'::JSONB,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "deletedAt" TIMESTAMPTZ NULL -- Soft delete column
);

COMMENT ON COLUMN "Thread"."lockHistory" IS '{
"lockedBy": "string", -- ID of the user who locked the thread
"lockedAt": "string" -- Timestamp of when the thread was locked
}';

-- Event Table
CREATE TABLE "Event" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" JSONB NOT NULL,
    "participants" JSONB NOT NULL DEFAULT '[]'::JSONB,
    "verifiers" JSONB NOT NULL DEFAULT '[]'::JSONB,
    "type" "EventType" NOT NULL,
    "createdBy" UUID NOT NULL REFERENCES "User"("id"),
    "status" "EventStatus" NOT NULL,
    "capacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "deletedAt" TIMESTAMPTZ NULL -- Soft delete column
);

COMMENT ON COLUMN "Event"."location" IS '{
"address": "string",
"coordinates": {
"latitude": "number",
"longitude": "number"
},
"venue": "string | null"
}';

COMMENT ON COLUMN "Event"."participants" IS '{
"userId": "string",
"status": "confirmed | pending | declined"
}[]';

-- Add foreign key constraints for Event and Thread after both tables are created
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id");
ALTER TABLE "Event" ADD CONSTRAINT "Event_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id");

-- Message Table
CREATE TABLE "Message" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES "User"("id"),
    "parentId" UUID NULL REFERENCES "Message"("id"),
    "content" JSONB NOT NULL, -- Unified field for text or richObject
    "isEdited" BOOLEAN NOT NULL DEFAULT FALSE,
    "threadId" UUID NOT NULL REFERENCES "Thread"("id"),
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "deletedAt" TIMESTAMPTZ NULL -- Soft delete column
);

COMMENT ON COLUMN "Message"."content" IS '{
"text": "string", -- Always present (for plain text or as optional caption)
"images": "string[] | null", -- Optional array of image URLs
"videos": "string[] | null", -- Optional array of video URLs
"links": {
"url": "string",
"title": "string"
}[] | null -- Optional array of links with titles
}';

-- Tag Table
CREATE TABLE "Tag" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL UNIQUE,
    "description" TEXT NULL,
    "icon" TEXT NULL,
    "color" TEXT NULL,
    "parentId" UUID NULL REFERENCES "Tag"("id"),
    "createdBy" UUID NULL REFERENCES "User"("id"),
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "deletedAt" TIMESTAMPTZ NULL -- Soft delete column
);

-- Junction Table: Event-Tags
CREATE TABLE "EventTags" (
    "eventId" UUID NOT NULL REFERENCES "Event"("id") ON DELETE CASCADE,
    "tagId" UUID NOT NULL REFERENCES "Tag"("id") ON DELETE CASCADE,
    PRIMARY KEY ("eventId", "tagId"),
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "deletedAt" TIMESTAMPTZ NULL -- Soft delete column
);

COMMENT ON TABLE "EventTags" IS 'Junction table for many-to-many relationship between Event and Tag';
COMMENT ON COLUMN "EventTags"."eventId" IS 'ID of the event';
COMMENT ON COLUMN "EventTags"."tagId" IS 'ID of the tag';

-- Junction Table: Event-Media
CREATE TABLE "EventMedia" (
    "eventId" UUID NOT NULL REFERENCES "Event"("id") ON DELETE CASCADE,
    "mediaId" UUID NOT NULL REFERENCES "Media"("id") ON DELETE CASCADE,
    PRIMARY KEY ("eventId", "mediaId"),
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "deletedAt" TIMESTAMPTZ NULL -- Soft delete column
);

COMMENT ON TABLE "EventMedia" IS 'Junction table for many-to-many relationship between Event and Media';
COMMENT ON COLUMN "EventMedia"."eventId" IS 'ID of the event';
COMMENT ON COLUMN "EventMedia"."mediaId" IS 'ID of the media';