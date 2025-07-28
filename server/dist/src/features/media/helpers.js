import { RedisCache } from "@features/cache";
import { CACHE_NAMESPACE_CONFIG } from "@constants";
import { jnstringify } from "@utils";
const mediaCache = new RedisCache({
    namespace: CACHE_NAMESPACE_CONFIG.Media.namespace,
    defaultTTLSeconds: CACHE_NAMESPACE_CONFIG.Media.ttl,
});
const eventMediaCache = new RedisCache({
    namespace: CACHE_NAMESPACE_CONFIG.Events.namespace,
    defaultTTLSeconds: CACHE_NAMESPACE_CONFIG.Events.ttl,
});
export const getMediaCache = async (mediaId) => {
    return mediaCache.getItem(mediaId);
};
export const setMediaCache = async (mediaId, media, ttl = mediaCache.defaultTTLMs) => {
    return mediaCache.setItem(mediaId, media, ttl);
};
export const deleteMediaCache = async (mediaId) => {
    return mediaCache.deleteItem(mediaId);
};
export const updateMediaCache = async (mediaId, media) => {
    return mediaCache.updateValue(mediaId, media);
};
export const setMediaBulkCache = async (medias, ttl = mediaCache.defaultTTLMs) => {
    const pipeline = mediaCache.getPipeline();
    medias.forEach((media) => {
        const key = `${mediaCache.namespace}:${media.id}`;
        pipeline.set(key, jnstringify(media));
        pipeline.expire(key, ttl);
    });
    await pipeline.exec();
    return "OK";
};
export const getEventMediaCache = async (eventId) => {
    return eventMediaCache.getItem(`${eventId}:media`);
};
export const setEventMediaCache = async (eventId, media) => {
    return eventMediaCache.setItem(`${eventId}:media`, media);
};
export const deleteEventMediaCache = (eventId) => eventMediaCache.deleteItem(`${eventId}:media`);
//# sourceMappingURL=helpers.js.map