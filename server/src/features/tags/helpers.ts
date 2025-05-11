import { ITag } from "@definitions/types";
import { RedisCache } from "@features/cache";
import { CACHE_NAMESPACES, DEFAULT_NAMESPACE_CACHE_TTL } from "@constants";
import logger from "@logger";
import { jnstringify } from "@utils";

const tagCache = new RedisCache({
  namespace: CACHE_NAMESPACES.TAGS,
  defaultTTLSeconds: DEFAULT_NAMESPACE_CACHE_TTL[CACHE_NAMESPACES.TAGS],
});

const eventTagsCache = new RedisCache({
  namespace: CACHE_NAMESPACES.EVENTS,
  defaultTTLSeconds: DEFAULT_NAMESPACE_CACHE_TTL[CACHE_NAMESPACES.EVENTS],
});

export const getTagCache = (tagId: string) => tagCache.getItem<ITag>(tagId);

export const setTagCache = (tagId: string, tag: ITag) =>
  tagCache.setItem(tagId, tag);

export const deleteTagCache = (tagId: string) => tagCache.deleteItem(tagId);

export const setEventTagsCache = async (
  eventId: string,
  tags: ITag[]
): Promise<"OK"> => {
  const pipeline = eventTagsCache.getPipeline();
  const eventTagsKey = `${eventId}:tags`;
  tags.forEach((tag) => {
    pipeline.hset(eventTagsKey, {
      [tag.id]: tag,
    });
  });
  pipeline.expire(eventTagsKey, eventTagsCache.getDefaultTTL());
  const res = await pipeline.exec();
  logger.debug(
    `Result set event tags cache for event ${eventId}: ${jnstringify(res)}`
  );
  return "OK";
};

export const getEventTagsCache = (eventId: string) =>
  eventTagsCache.getItem<ITag[]>(`${eventId}:tags`);

export const deleteEventTagsCache = (eventId: string) =>
  eventTagsCache.deleteItem(`${eventId}:tags`);
