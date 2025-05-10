import { IMedia, IPaginationParams } from "@/definitions/types";
import Base from "../Base";
import { EMediaProvider, EQueryOperator } from "@/definitions/enums";
import { validateMediaCreate, validateMediaUpdate } from "./validation";
import {
  MEDIA_TABLE_NAME,
  MEDIA_EVENT_JUNCTION_TABLE_NAME,
  MEDIA_BUCKET_CONFIG,
} from "./constants";
import { omit } from "@utils";
import { SecureMethodCache } from "@decorators";
import {
  deleteMediaCache,
  setMediaCache,
  setMediaPublicUrlCache,
  updateMediaCache,
  getMediaPublicUrlCache,
} from "./helpers";
import { getMediaCache } from "./helpers";
import { PostgrestError } from "@supabase/postgrest-js";
import { get32BitMD5Hash } from "@helpers";

class MediaService extends Base<IMedia> {
  private readonly getCache = getMediaCache;
  private readonly setCache = setMediaCache;
  private readonly deleteCache = deleteMediaCache;

  constructor() {
    super(MEDIA_TABLE_NAME);
  }

  @SecureMethodCache<IMedia>()
  async getAllEventMedia(
    eventId: string,
    pagination: Partial<IPaginationParams> = {}
  ) {
    const { data: eventMedia, error: eventMediaError } =
      await this._supabaseService.querySupabase({
        table: MEDIA_EVENT_JUNCTION_TABLE_NAME,
        query: [
          { column: "eventId", operator: EQueryOperator.Eq, value: eventId },
        ],
      });

    if (eventMediaError) return { error: eventMediaError };
    const { data, error } = await super.getAll(
      {
        select: `*`,
        modifyQuery: (qb) =>
          qb.in("id", eventMedia?.map((media) => media.mediaId) || []),
      },
      pagination
    );

    if (error) return { error };

    const formattedData = (data?.items || []).map((item) => ({
      eventId: (item as IMedia & { eventId: string }).eventId,
      ...item,
    }));

    return {
      data: {
        items: formattedData,
        pagination: data!.pagination,
      },
      error,
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
          path,
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

  @SecureMethodCache<IMedia>({
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

        const path = validatedData.path;

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
          row: creationData[0],
          ...signedUrl.data,
        };
      })
    );
  }

  @SecureMethodCache<IMedia>()
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

  @SecureMethodCache<IMedia>()
  async create<U extends Partial<Omit<IMedia, "id" | "updatedAt">>>(data: U) {
    return validateMediaCreate(data, (data) => super.create(data));
  }

  @SecureMethodCache<IMedia>()
  async getById(
    id: string
  ): Promise<{ data: IMedia; error: PostgrestError | null }> {
    const res = await super.getById(id);
    if (res.data) {
      const publicUrl = await this.getPublicUrl(
        res.data.url,
        res.data.storage.bucket
      );
      res.data.publicUrl = publicUrl.data;
    }
    return res;
  }

  @SecureMethodCache<string>({
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

    return { data: publicUrl.data.signedUrl, error: null };
  }

  @SecureMethodCache<IMedia>()
  async delete(id: string) {
    const res = await super.delete(id);
    await this.deleteFile(res.data.storage.bucket, res.data.url);
    if (res.data) {
      await this.deleteCache(id);
    }
    return res;
  }
}

export default MediaService;
