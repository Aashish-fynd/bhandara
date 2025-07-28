import { RedisCache } from "@features/cache";
import { CACHE_NAMESPACE_CONFIG } from "@constants";
const eventCache = new RedisCache({
    namespace: CACHE_NAMESPACE_CONFIG.Events.namespace,
    defaultTTLSeconds: CACHE_NAMESPACE_CONFIG.Events.ttl,
});
/** Fetch an event from cache by ID. */
export const getEventCache = (eventId) => eventCache.getItem(`${eventId}`);
/** Store an event in cache. */
export const setEventCache = (eventId, event) => eventCache.setItem(`${eventId}`, event);
/** Remove all cached entries for an event. */
export const deleteEventCache = (eventId) => eventCache.deleteItem(`${eventId}*`);
/** Retrieve cached users for an event. */
export const getEventUsersCache = (key) => eventCache.getItem(key);
/** Cache a map of users for an event. */
export const setEventUsersCache = (key, users) => eventCache.setItem(key, users);
//# sourceMappingURL=helpers.js.map