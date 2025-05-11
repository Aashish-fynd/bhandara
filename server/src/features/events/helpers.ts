import { RedisCache } from "@features/cache";
import { CACHE_NAMESPACES, DEFAULT_NAMESPACE_CACHE_TTL } from "@constants";
import { ITag } from "@definitions/types";

const eventTagsCache = new RedisCache({
  namespace: CACHE_NAMESPACES.EVENTS,
  defaultTTLSeconds: DEFAULT_NAMESPACE_CACHE_TTL[CACHE_NAMESPACES.EVENTS],
});

export const setEventTagsCache = (eventId: string, tags: ITag[]) => {
  const pipeline = eventTagsCache.getPipeline();
  const eventTagsKey = `${eventId}:tags`;
  tags.forEach((tag) => {
    pipeline.hset(eventTagsKey, {
      [tag.id]: tag,
    });
  });
  pipeline.expire(eventTagsKey, eventTagsCache.getDefaultTTL());
  return pipeline.exec();
};

export const getEventTagsCache = (eventId: string) =>
  eventTagsCache.getItem(`${eventId}:tags`);

export const deleteEventTagsCache = (eventId: string) =>
  eventTagsCache.deleteItem(`${eventId}:tags`);
