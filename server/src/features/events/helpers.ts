import { RedisCache } from "@features/cache";
import { CACHE_NAMESPACE_CONFIG } from "@constants";
import { IBaseUser, IEvent } from "@definitions/types";

const eventCache = new RedisCache({
  namespace: CACHE_NAMESPACE_CONFIG.Events.namespace,
  defaultTTLSeconds: CACHE_NAMESPACE_CONFIG.Events.ttl,
});

export const getEventCache = (eventId: string) =>
  eventCache.getItem<IEvent>(`${eventId}`);

export const setEventCache = (eventId: string, event: IEvent) =>
  eventCache.setItem(`${eventId}`, event);

export const deleteEventCache = (eventId: string) =>
  eventCache.deleteItem(`${eventId}*`);

export const getEventUsersCache = (key: string) =>
  eventCache.getItem<Record<string, IBaseUser>>(key);

export const setEventUsersCache = (
  key: string,
  users: Record<string, IBaseUser>
) => eventCache.setItem(key, users);
