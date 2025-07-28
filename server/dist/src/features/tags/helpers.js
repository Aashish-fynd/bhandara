import { RedisCache } from "@features/cache";
import { CACHE_NAMESPACE_CONFIG } from "@constants";
import logger from "@logger";
import { isEmpty, jnstringify } from "@utils";
const tagCache = new RedisCache({
    namespace: CACHE_NAMESPACE_CONFIG.Tags.namespace,
    defaultTTLSeconds: CACHE_NAMESPACE_CONFIG.Tags.ttl,
});
const eventTagsCache = new RedisCache({
    namespace: CACHE_NAMESPACE_CONFIG.Events.namespace,
    defaultTTLSeconds: CACHE_NAMESPACE_CONFIG.Events.ttl,
});
export const getTagCache = (tagId) => tagCache.getItem(tagId);
export const setTagCache = (tagId, tag) => tagCache.setItem(tagId, tag);
export const deleteTagCache = (tagId) => tagCache.deleteItem(tagId);
export const setEventTagsCache = async (eventId, tags) => {
    const pipeline = eventTagsCache.getPipeline();
    const eventTagsKey = `${CACHE_NAMESPACE_CONFIG.Events.namespace}:${eventId}:tags`;
    tags.forEach((tag) => {
        pipeline.hset(eventTagsKey, {
            [tag.id]: jnstringify(tag),
        });
    });
    pipeline.expire(eventTagsKey, eventTagsCache.defaultTTLMs);
    const res = await pipeline.exec();
    logger.debug(`Result set event tags cache for event ${eventId}: ${jnstringify(res)}`);
    return "OK";
};
export const getEventTagsCache = async (eventId) => {
    const tags = await eventTagsCache.getHKeys(`${eventId}:tags`);
    const formattedTags = Object.keys(tags).map((tag) => JSON.parse(tags[tag]));
    return isEmpty(formattedTags) ? null : formattedTags;
};
export const deleteEventTagsCache = (eventId) => eventTagsCache.deleteItem(`${eventId}:tags`);
export const getSubTagsCache = (tagId) => tagCache.getItem(`${tagId}:sub-tags`);
export const setSubTagsCache = (tagId, tags) => tagCache.setItem(`${tagId}:sub-tags`, tags, 3600);
export const deleteSubTagsCache = (tagId) => tagCache.deleteItem(`${tagId}:sub-tags`);
//# sourceMappingURL=helpers.js.map