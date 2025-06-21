import { CACHE_NAMESPACE_CONFIG } from "@constants";
import { IBaseThread } from "@definitions/types";
import { RedisCache } from "@features/cache";

const threadsCache = new RedisCache({
  namespace: CACHE_NAMESPACE_CONFIG.Threads.namespace,
  defaultTTLSeconds: CACHE_NAMESPACE_CONFIG.Threads.ttl,
});

export const getThreadCache = async (id: string) => {
  return await threadsCache.getItem<IBaseThread>(id);
};

export const setThreadCache = async (id: string, data: IBaseThread) => {
  return await threadsCache.setItem(id, data);
};

export const deleteThreadCache = async (id: string) => {
  return await threadsCache.deleteItem(id);
};
