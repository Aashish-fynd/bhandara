import {
  IMedia,
  IMediaEventJunction,
  IPaginationParams,
} from "@/definitions/types";
import Base from "../Base";
import { EMediaProvider, EQueryOperator } from "@/definitions/enums";
import { validateMediaCreate, validateMediaUpdate } from "./validation";
import {
  MEDIA_TABLE_NAME,
  MEDIA_EVENT_JUNCTION_TABLE_NAME,
  MEDIA_BUCKET_CONFIG,
} from "./constants";
import { isEmpty, omit } from "@utils";
import { MethodCacheSync } from "@decorators";
import {
  deleteMediaCache,
  setMediaCache,
  setMediaPublicUrlCache,
  updateMediaCache,
  getMediaPublicUrlCache,
  deleteMediaPublicUrlCache,
} from "./helpers";
import { getMediaCache } from "./helpers";
import { PostgrestError } from "@supabase/postgrest-js";
import { get32BitMD5Hash } from "@helpers";
import logger from "@logger";
import { appendUUIDToFilename } from "./utils";

class MediaService extends Base<IMedia> {
  private readonly getCache = getMediaCache;
  private readonly setCache = setMediaCache;
  private readonly deleteCache = deleteMediaCache;

  constructor() {
    super(MEDIA_TABLE_NAME);
  }

  @MethodCacheSync<IMedia>()
  async getEventMedia(eventId: string, limit: number | null = null) {
    const { data: eventMedia, error: eventMediaError } =
      await this._supabaseService.querySupabase({
        table: MEDIA_EVENT_JUNCTION_TABLE_NAME,
        query: [
          { column: "eventId", operator: EQueryOperator.Eq, value: eventId },
        ],
        modifyQuery: (qb) => {
          if (limit) qb.limit(limit);
          return qb;
        },
      });

    if (eventMediaError) return { error: eventMediaError };
    const { data } = await super.getAll(
      {
        query: [
          {
            column: "id",
            operator: EQueryOperator.In,
            value:
              eventMedia?.map((media: { mediaId: string }) => media.mediaId) ||
              [],
          },
        ],
      },
      { limit }
    );

    const publicUrlPromises = (data?.items || []).map(async (item) => {
      const publicUrl = await this.getPublicUrl(item.url, item.storage.bucket);
      return {
        ...item,
        publicUrl: publicUrl.data.signedUrl,
        publicUrlExpiresAt: publicUrl.data.expiresAt,
      };
    });

    const publicUrls = await Promise.all(publicUrlPromises);

    return {
      data: publicUrls,
      error: null,
    };
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
          path: appendUUIDToFilename(path),
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
    if (error) return { error };
    return { data: { path, deleted: true }, error: null };
  }

  @MethodCacheSync<IMedia>({
    cacheSetterWithExistingTTL: updateMediaCache,
  })
  async update<U extends Partial<IMedia>>(id: string, data: U) {
    return validateMediaUpdate(data, (validatedData) =>
      super.update(id, validatedData)
    );
  }

  async getSignedUrlForUpload(insertData: {
    bucket: string;
    path: string;
    options: Record<string, any>;
    mimeType: string;
  }) {
    return validateMediaCreate(insertData, (validatedData) =>
      this._supabaseService.transaction(async (client) => {
        const { name: fileName, ...restOptions } = validatedData.options || {};

        const bucket = validatedData.bucket;

        const bucketConfig = MEDIA_BUCKET_CONFIG[validatedData.bucket];
        if (!bucketConfig) throw new Error("Bucket not found");
        if (validatedData.options.size > bucketConfig.maxFileSize)
          throw new Error("File size too large");

        const path = appendUUIDToFilename(validatedData.path);

        omit(validatedData, ["path", "bucket", "options"]);
        delete restOptions.path;

        // create media record
        const createData = {
          url: `${path}`,
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

        const { data: creationData } = await client
          .from(MEDIA_TABLE_NAME)
          .insert(createData)
          .select();

        const signedUrl = await this._supabaseService.getSignedUrlForUpload({
          path,
          bucket,
        });

        delete signedUrl.data.token;
        return {
          row: creationData[0] as IMedia,
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
    return validateMediaCreate(data, (validatedData) => {
      const { path, ...rest } = validatedData;
      return super.create({
        ...rest,
        path: appendUUIDToFilename(path),
      });
    });
  }

  @MethodCacheSync<IMedia>()
  async getById(
    id: string
  ): Promise<{ data: IMedia; error: PostgrestError | null }> {
    const res = await super.getById(id);
    if (res.data) {
      const publicUrl = await this.getPublicUrl(
        res.data.url,
        res.data.storage.bucket
      );
      res.data.publicUrl = publicUrl.data.signedUrl;
      res.data.publicUrlExpiresAt = publicUrl.data.expiresAt;
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
      data: {
        signedUrl: publicUrl.data.signedUrl,
        expiresAt: new Date(Date.now() + 3600 * 24 * 1000),
      },
      error: null,
    };
  }

  @MethodCacheSync<IMedia>({
    cacheDeleter: (id: string, existingData: IMedia) =>
      Promise.all([
        deleteMediaCache(id),
        deleteMediaPublicUrlCache(get32BitMD5Hash(existingData.url)),
      ]),
  })
  async delete(id: string) {
    const res = await super.delete(id);
    const deletionResult = await this.deleteFile(
      res.data.storage.bucket,
      res.data.url
    );
    logger.debug(`Deleted media ${id}`, { deletionResult });
    return res;
  }

  async getMediaByIds(
    ids: string[]
  ): Promise<{ data: Record<string, IMedia>; error: PostgrestError | null }> {
    const mediaData = await this._supabaseService.querySupabase<IMedia>({
      table: MEDIA_TABLE_NAME,
      query: [{ column: "id", operator: EQueryOperator.In, value: ids }],
    });
    if (!isEmpty(mediaData.data)) {
      const mediaDataWithPublicUrl = await Promise.all(
        (mediaData.data as IMedia[]).map(async (media: IMedia) => {
          const publicUrl = await this.getPublicUrl(
            media.url,
            media.storage.bucket
          );
          return {
            ...media,
            publicUrl: publicUrl.data.signedUrl,
            publicUrlExpiresAt: publicUrl.data.expiresAt,
          };
        })
      );

      // Convert array to object with id as key
      const mediaMap = mediaDataWithPublicUrl.reduce((acc, media) => {
        acc[media.id] = media;
        return acc;
      }, {} as Record<string, IMedia>);

      return { data: mediaMap, error: null };
    }
    return { data: {}, error: mediaData.error };
  }

  async getEventMediaJunctionRow(eventId: string, mediaId: string) {
    return this._supabaseService.querySupabase({
      table: MEDIA_EVENT_JUNCTION_TABLE_NAME,
      query: [
        { column: "eventId", operator: EQueryOperator.Eq, value: eventId },
        { column: "mediaId", operator: EQueryOperator.Eq, value: mediaId },
      ],
    });
  }

  async createEventMediaJunctionRow(eventId: string, mediaId: string) {
    return this._supabaseService.insertIntoDB({
      table: MEDIA_EVENT_JUNCTION_TABLE_NAME,
      data: { eventId, mediaId },
    });
  }

  async deleteEventMediaJunctionRow(eventId: string, mediaId: string) {
    return this._supabaseService.deleteByQuery({
      table: MEDIA_EVENT_JUNCTION_TABLE_NAME,
      query: [
        { column: "eventId", operator: EQueryOperator.Eq, value: eventId },
        { column: "mediaId", operator: EQueryOperator.Eq, value: mediaId },
      ],
    });
  }
}

export default MediaService;
