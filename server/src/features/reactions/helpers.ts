import { RedisCache } from "@features/cache";
import { CACHE_NAMESPACE_CONFIG } from "@constants";
import { IReaction } from "@definitions/types";

const reactionCache = new RedisCache({
  namespace: CACHE_NAMESPACE_CONFIG.Reactions.namespace,
  defaultTTLSeconds: CACHE_NAMESPACE_CONFIG.Reactions.ttl,
});

export const getReactionCache = (key: string) => reactionCache.getItem<IReaction[]>(key);
export const setReactionCache = (key: string, value: IReaction[]) => reactionCache.setItem(key, value);
export const deleteReactionCache = (key: string) => reactionCache.deleteItem(key);
