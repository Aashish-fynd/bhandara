import { IMedia, IPaginationParams } from "@/definitions/types";
import { EMediaProvider } from "@/definitions/enums";
import {
  createRecord,
  deleteRecord,
  findAllWithPagination,
  findById,
  runTransaction,
  updateRecord,
} from "@utils/dbUtils";
import SupabaseService from "@supabase";
import { validateMediaCreate, validateMediaUpdate } from "./validation";
import { MEDIA_BUCKET_CONFIG } from "./constants";
import { Media } from "./model";
import { Event } from "../events/model";
import { isEmpty, omit } from "@utils";
import { MethodCacheSync } from "@decorators";
import {
  deleteMediaCache,
  setMediaCache,
  setMediaPublicUrlCache,
  updateMediaCache,
  getMediaPublicUrlCache,
  setMediaBulkCache,
} from "./helpers";
import { getMediaCache } from "./helpers";
import { get32BitMD5Hash } from "@helpers";
import logger from "@logger";
import { getUniqueFilename as getUniqueFilename } from "./utils";
import { BadRequestError } from "@exceptions";
import CustomError from "@exceptions/CustomError";
import { CACHE_NAMESPACE_CONFIG } from "@constants";

class MediaService {
  private readonly getCache = getMediaCache;
  private readonly setCache = setMediaCache;
  private readonly deleteCache = deleteMediaCache;
  private readonly _supabaseService = new SupabaseService();

  async _getByIdNoCache(id: string) {
    return findById(Media, id);
  }

  @MethodCacheSync<IMedia>()
  async getEventMedia(eventId: string, limit: number | null = null) {
    const events = await findById(Event, eventId);
    const mediaIds = (events[0]?.media || []) as string[];
    if (!mediaIds.length) return [];

    const data = await findAllWithPagination(
      Media,
      { id: mediaIds },
      { limit: limit ?? mediaIds.length }
    );

    const publicUrlPromises = (data?.items || []).map(async (item) => {
      const publicUrl = await this.getPublicUrl(item.url, item.storage.bucket);
      return {
        ...item,
        publicUrl: publicUrl.signedUrl,
        publicUrlExpiresAt: publicUrl.expiresAt,
      };
    });

    const publicUrls = await Promise.all(publicUrlPromises);

    return publicUrls;
  }

  async uploadFile({
    path,
    bucket,
    file,
    mimeType,
    options,
  }: {
    file: string;
    path: string;
    bucket: string;
    mimeType: string;
    options?: Record<string, any>;
  }) {
    return validateMediaCreate(
      { path, bucket, file, mimeType, options },
      async () => {
        const { data, error } = await this._supabaseService.uploadFile({
          bucket,
          base64FileData: file,
          mimeType,
          path: getUniqueFilename(path),
          options,
        });

        if (error) {
          return { error };
        }

        const { fullPath, id, ...rest } = data;

        let { name: fileName, ...restOptions } = options || {};

        fileName ??= data?.path.split("/").pop() || "";

        // create media record
        return this.create({
          id,
          url: fullPath,
          storage: {
            metadata: rest,
            provider: EMediaProvider.Supabase,
            bucket,
          },
          metadata: { ...data, ...restOptions?.metadata },
          mimeType,
          name: fileName,
          ...restOptions,
        });
      }
    );
  }

  async deleteFile(bucket: string, path: string) {
    const { error } = await this._supabaseService.deleteFile({
      bucket,
      paths: [path],
    });
    if (error) throw error;
    return { path, deleted: true };
  }

  @MethodCacheSync<IMedia>({
    cacheSetterWithExistingTTL: updateMediaCache,
  })
  async update<U extends Partial<IMedia>>(id: string, data: U) {
    const res = await validateMediaUpdate(data, (validatedData) =>
      updateRecord(Media, { id }, validatedData)
    );
    return res;
  }

  async getSignedUrlForUpload(insertData: {
    bucket: string;
    path: string;
    options: Record<string, any>;
    mimeType: string;
  }) {
    return validateMediaCreate(insertData, (validatedData) =>
      runTransaction(async (tx) => {
        const { name: fileName, ...restOptions } = validatedData.options || {};

        const bucket = validatedData.bucket;

        const bucketConfig = MEDIA_BUCKET_CONFIG[validatedData.bucket];
        if (!bucketConfig) throw new Error("Bucket not found");
        if (validatedData.options.size > bucketConfig.maxSize)
          throw new BadRequestError("File size too large");

        const path = getUniqueFilename(validatedData.path);

        omit(validatedData, ["path", "bucket", "options"]);
        delete restOptions.path;

        // create media record
        const createData = {
          url: path,
          storage: {
            metadata: {},
            bucket,
            provider: EMediaProvider.Supabase,
          },
          metadata: { ...restOptions?.metadata },
          mimeType: insertData.mimeType,
          name: fileName,
          ...restOptions,
          access: "public",
        };

        const creationData = await Media.create(createData as any, {
          transaction: tx,
          raw: true,
        });

        const signedUrl = await this._supabaseService.getSignedUrlForUpload({
          path,
          bucket,
        });

        delete signedUrl.data.token;
        return {
          row: creationData as IMedia,
          ...signedUrl.data,
        };
    })
    );
  }

  @MethodCacheSync<IMedia>()
  async uploadFileToSignedUrl({
    bucket,
    path,
    base64FileData,
    mimeType,
    token,
  }) {
    return this._supabaseService.uploadFileToSignedUrl({
      bucket,
      path,
      base64FileData,
      mimeType,
      token,
    });
  }

  @MethodCacheSync<IMedia>()
  async create<U extends Partial<Omit<IMedia, "id" | "updatedAt">>>(data: U) {
    const res = await validateMediaCreate(data, (validatedData) => {
      const { path, ...rest } = validatedData;
      return createRecord(Media, {
        ...rest,
        path: getUniqueFilename(path),
      });
    });
    return res;
  }

  @MethodCacheSync<IMedia>()
  async getById(id: string): Promise<IMedia | null> {
    const res = await findById(Media, id);
    if (res) {
      const publicUrl = await this.getPublicUrl(
        res.url,
        res.storage.bucket
      );
      (res as any).publicUrl = publicUrl.signedUrl;
      (res as any).publicUrlExpiresAt = publicUrl.expiresAt;
    }
    return res;
  }

  @MethodCacheSync<string>({
    cacheSetter: setMediaPublicUrlCache,
    cacheGetter: getMediaPublicUrlCache,
    customCacheKey: (path: string) => get32BitMD5Hash(path),
  })
  async getPublicUrl(path: string, bucket: string) {
    const publicUrl = await this._supabaseService.getPublicUrl({
      bucket,
      path,
      expiresIn: 3600 * 24,
    });

    return {
      signedUrl: publicUrl.data.signedUrl,
      expiresAt: new Date(Date.now() + 3600 * 24 * 1000),
    };
  }

  async getBulkPublicUrls(
    paths: string[],
    bucket: string,
    expiresIn: number = CACHE_NAMESPACE_CONFIG.Media.ttl
  ) {
    const { data: publicUrls, error } =
      await this._supabaseService.getBulkPublicUrls({
        bucket,
        paths,
        expiresIn,
      });

    if (error) throw error;

    const publicUrlsWithExpiresAt = publicUrls.map((url) => {
      return {
        ...url,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      };
    });

    const mediaWithPublicUrls = publicUrlsWithExpiresAt.reduce((acc, url) => {
      acc[url.path] = url;
      return acc;
    }, {} as Record<string, { signedUrl: string; expiresAt: Date }>);

    return mediaWithPublicUrls;
  }

  @MethodCacheSync<IMedia>({})
  async delete(id: string) {
    return runTransaction(async (tx) => {
      const media = await Media.findByPk(id, { transaction: tx });
      if (!media) return null;
      await media.destroy({ transaction: tx });
      const deletionResult = await this.deleteFile(
        media.storage.bucket,
        media.url
      );
      logger.debug(`Deleted media ${id}`, { deletionResult });
      return media;
    }) as any;
  }

  async getMediaByIds(ids: string[]): Promise<Record<string, IMedia>> {
    const filteredIds = new Set(ids.filter((id) => !!id));

    if (filteredIds.size === 0) return {};

    const res = await findAllWithPagination(
      Media,
      { id: Array.from(filteredIds) },
      { limit: filteredIds.size }
    );
    const mediaData = { data: res.items } as { data: IMedia[] };
    if (!isEmpty(mediaData.data)) {
      // split according to buckets
      const bucketPathsMapping = (mediaData.data as IMedia[]).reduce(
        (acc, media) => {
          if (!acc[media.storage.bucket]) {
            acc[media.storage.bucket] = [];
          }
          acc[media.storage.bucket].push(media.url);
          return acc;
        },
        {} as Record<string, string[]>
      );

      const bucketGroupedPublicUrls = await Promise.all(
        Object.entries(bucketPathsMapping).map(([bucket, paths]) =>
          this.getBulkPublicUrls(paths, bucket)
        )
      );

      const publicUrls = bucketGroupedPublicUrls.reduce(
        (acc, bucketPublicUrls) => {
          return {
            ...acc,
            ...bucketPublicUrls.data,
          };
        },
        {} as Record<
          string,
          { signedUrl: string; expiresAt: Date; error?: any }
        >
      );

      // Create a map of media data with their public URLs
      const mediaWithUrls = (mediaData.data as IMedia[]).reduce(
        (acc, media) => {
          const publicUrl = publicUrls[media.url];

          if (!publicUrl) {
            logger.error(`Public url not found for media ${media.id}`);
            return acc;
          }

          if ("error" in publicUrl && publicUrl.error) {
            logger.error("Error getting public url for media", {
              mediaId: media.id,
              error: publicUrl.error,
            });
            return acc;
          }

          acc[media.id] = {
            ...media,
            publicUrl: publicUrl?.signedUrl,
            publicUrlExpiresAt: publicUrl?.expiresAt,
          };
          return acc;
        },
        {}
      );

      await setMediaBulkCache(Object.values(mediaWithUrls));

      return mediaWithUrls;
    }
    return {};
  }

  async getEventMediaJunctionRow(eventId: string, mediaId: string) {
    const event = await findById(Event, eventId);
    const exists = (event[0]?.media || []).includes(mediaId);
    return exists ? { eventId, mediaId } : null;
  }

  async createEventMediaJunctionRow(eventId: string, mediaId: string) {
    const event = await findById(Event, eventId);
    const mediaSet = new Set((event?.media || []) as unknown as string[]);
    mediaSet.add(mediaId);
    const data = await updateRecord(Event, { id: eventId }, {
      media: Array.from(mediaSet) as any,
    });
    return data;
  }

  async deleteEventMediaJunctionRow(eventId: string, mediaId: string) {
    const event = await findById(Event, eventId);
    const media = (event[0]?.media || []) as string[];
    const data = await updateRecord(Event, { id: eventId }, {
      media: media.filter((m) => m !== mediaId) as any,
    });
    return data;
  }
}

export default MediaService;
