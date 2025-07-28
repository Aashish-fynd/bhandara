import { CACHE_NAMESPACE_CONFIG } from "@constants";
import { RedisCache } from "@features/cache";
const messagesCache = new RedisCache({
    namespace: CACHE_NAMESPACE_CONFIG.Messages.namespace,
    defaultTTLSeconds: CACHE_NAMESPACE_CONFIG.Messages.ttl,
});
export const getMessageCache = async (id) => {
    return await messagesCache.getItem(id);
};
export const setMessageCache = async (id, data) => {
    return await messagesCache.setItem(id, data);
};
export const deleteMessageCache = async (id) => {
    return await messagesCache.deleteItem(id);
};
//# sourceMappingURL=helpers.js.map