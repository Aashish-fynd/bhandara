import { CACHE_NAMESPACE_CONFIG } from "@constants";
import { RedisCache } from "@features/cache";
import { IDiscussionThread, IQnAThread } from "@definitions/types";

const threadsCache = new RedisCache({
  namespace: CACHE_NAMESPACE_CONFIG.Threads.namespace,
  defaultTTLSeconds: CACHE_NAMESPACE_CONFIG.Threads.ttl,
});

export const getThreadCache = async (id: string) => {
  return await threadsCache.getItem<IDiscussionThread | IQnAThread>(id);
};

export const setThreadCache = async (
  id: string,
  data: IDiscussionThread | IQnAThread
) => {
  return await threadsCache.setItem(id, data);
};

export const deleteThreadCache = async (id: string) => {
  return await threadsCache.deleteItem(id);
};
