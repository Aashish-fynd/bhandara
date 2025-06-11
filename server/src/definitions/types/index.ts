import { Request } from "express";
import {
  EAccessLevel,
  EEventParticipantStatus,
  EEventStatus,
  EEventType,
  EMediaProvider,
  EMediaType,
  EThreadType,
} from "@/definitions/enums";

// Base Interface for Timestamps
export interface ITimeStamp {
  createdAt: Date; // Always present
  updatedAt: Date; // Always present
  deletedAt?: Date | null; // Soft delete column
}

// Base User Interface
export interface IBaseUser extends ITimeStamp {
  id: string;
  name: string;
  email: string;
  gender: string;
  address: Record<string, any> | null; // JSONB field
  isVerified: boolean;
  password: string | null;
  meta: Record<string, any>;
  profilePic: Record<string, any> | null;
  mediaId: string | null | IMedia;
  username?: string;
  media?: IMedia;
}

// Message Content Type
export type IMessageContent = {
  text?: string; // Optional caption
  media?: IMedia[] | string[]; // Array of media IDs
  links?: { url: string; title: string }[]; // Array of links with titles
};

// Message Interface
export interface IMessage extends ITimeStamp {
  id: string;
  userId: string;
  parentId: string | null;
  content: IMessageContent;
  isEdited: boolean;
  threadId: string;
  user: IBaseUser;
}

// Thread Lock History
interface ILockHistory {
  lockedBy: string; // ID of the user who locked the thread
  lockedAt: Date; // Timestamp of when the thread was locked
}

// Base Thread Interface
export interface IBaseThread extends ITimeStamp {
  id: string;
  type: EThreadType;
  status: EAccessLevel;
  visibility: EAccessLevel;
  lockHistory: ILockHistory[];
  eventId: string;
  messages?: IMessage[];
}

// Location Interface
export interface ILocation {
  address: string;
  coordinates?: { latitude: number; longitude: number }; // Optional geolocation
  venueName?: string; // Optional venue name
}

// Event Participant Interface
interface IParticipant {
  user: string | IBaseUser;
  status: EEventParticipantStatus;
}

// Event Interface
export interface IEvent extends ITimeStamp {
  id: string;
  name: string;
  description: string;
  location: ILocation; // JSONB field
  participants: IParticipant[]; // JSONB field
  verifiers: { user: string | IBaseUser; verifiedAt: Date | string }[]; // Array of verifier IDs
  threadId: string; // References "Thread" table
  type: EEventType;
  createdBy: string; // References "User" table
  creator?: IBaseUser;
  status: EEventStatus;
  capacity: number;
  tags: ITag[]; // Array of tag IDs
  media: IMedia[]; // Array of media IDs
}

// Tag Interface
export interface ITag extends ITimeStamp {
  id: string;
  name: string;
  value: string; // Normalized tag name, always unique
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  parentId?: string | null; // References "Tag" table
  createdBy?: string | null; // References "User" table
  eventId?: string | null; // References "Event" table
}

// Media Storage Interface
interface IMediaStorage {
  provider: EMediaProvider;
  bucket: string;
  metadata: Record<string, any>;
}

// Media Interface
export interface IMedia extends ITimeStamp {
  id: string;
  type: EMediaType;
  url: string;
  publicUrl?: string;
  publicUrlExpiresAt?: Date;
  caption?: string | null;
  thumbnail?: string | null;
  size?: number | null;
  mimeType?: string | null;
  duration?: number | null;
  uploader: string; // References "User" table
  storage: IMediaStorage; // JSONB field
  accessLevel: EAccessLevel;
  metadata: Record<string, any>;

  path?: string;
}

export interface IMediaEventJunction extends ITimeStamp {
  eventId: string;
  mediaId: string;
}

export interface IPaginationParams {
  limit: number;
  page: number;
  next: string | null;
  hasNext?: boolean;
  total?: number;
  sortBy: "createdAt" | "updatedAt";
  sortOrder: "asc" | "desc";
  startDate?: Date;
  endDate?: Date;
}

export interface ICustomRequest extends Request {
  user: IBaseUser;
  session: IUserSession;
}

export interface IUserSession {
  location: Record<string, any>;
  userAgent: {
    device: {
      model: string;
      vendor: string;
    };
    os: {
      name: string;
      version: string;
    };
    browser: {
      name: string;
      version: string;
    };
    ua: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  expiresIn: number;
  user: { id: string };
}

export interface IRequestPagination extends Request {
  pagination: IPaginationParams;
}
