import { IMedia } from "@definitions/types";
import { RedisCache } from "@features/cache";
import { CACHE_NAMESPACE_CONFIG } from "@constants";
import { jnstringify } from "@utils";

const mediaCache = new RedisCache({
  namespace: CACHE_NAMESPACE_CONFIG.Media.namespace,
  defaultTTLSeconds: CACHE_NAMESPACE_CONFIG.Media.ttl,
});
const mediaPublicUrlCache = new RedisCache({
  namespace: CACHE_NAMESPACE_CONFIG.MediaPublicUrl.namespace,
  defaultTTLSeconds: CACHE_NAMESPACE_CONFIG.MediaPublicUrl.ttl,
});

export const getMediaCache = async (mediaId: string) => {
  return mediaCache.getItem<IMedia>(mediaId);
};

export const setMediaCache = async (
  mediaId: string,
  media: IMedia,
  ttl = mediaCache.defaultTTLMs
) => {
  return mediaCache.setItem(mediaId, media, ttl);
};

export const deleteMediaCache = async (mediaId: string) => {
  return mediaCache.deleteItem(mediaId);
};

export const updateMediaCache = async (mediaId: string, media: IMedia) => {
  return mediaCache.updateValue(mediaId, media);
};

export const setMediaPublicUrlCache = async (
  mediaId: string,
  publicUrl: string,
  ttl = mediaPublicUrlCache.defaultTTLMs
) => {
  return mediaPublicUrlCache.setItem(mediaId, publicUrl, ttl);
};

export const setMediaBulkCache = async (
  medias: IMedia[],
  ttl = mediaCache.defaultTTLMs
) => {
  const pipeline = mediaCache.getPipeline();
  medias.forEach((media) => {
    const key = `${mediaCache.namespace}:${media.id}`;
    pipeline.set(key, jnstringify(media));
    pipeline.expire(key, ttl);
  });

  await pipeline.exec();
  return "OK";
};

export const deleteMediaPublicUrlCache = async (mediaId: string) => {
  return mediaPublicUrlCache.deleteItem(mediaId);
};

export const getMediaPublicUrlCache = async (mediaId: string) => {
  return mediaPublicUrlCache.getItem<string>(mediaId);
};
