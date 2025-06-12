export const CACHE_NAMESPACE_CONFIG = {
  Tags: {
    namespace: "tags",
    ttl: 3600 * 24,
  },
  Events: {
    namespace: "events",
    ttl: 3600 * 24,
  },
  Users: {
    namespace: "users",
    ttl: 3600,
  },
  Threads: {
    namespace: "threads",
    ttl: 3600 * 24,
  },
  Messages: {
    namespace: "messages",
    ttl: 3600 * 24 * 2,
  },
  Sessions: {
    namespace: "session",
    ttl: 3600 * 24 * 30,
  },
  Media: {
    namespace: "media",
    ttl: 3600 * 24,
  },
  MediaPublicUrl: {
    namespace: "media-public-url",
    ttl: 3600 * 24,
  },
};

export enum DB_CONNECTION_NAMES {
  Read = "read",
  Write = "write",
  Default = "default",
}
