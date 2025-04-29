import { IMedia, IPaginationParams } from "@/definitions/types/global";
import Base from "../Base";
import { EMediaProvider } from "@/definitions/enums";
import * as FileSystem from "expo-file-system";
import { validateMediaCreate, validateMediaUpdate } from "./validation";
import { MEDIA_TABLE_NAME, MEDIA_EVENT_JUNCTION_TABLE_NAME, MEDIA_FILE_BUCKET_NAME } from "./constants";
class MediaService extends Base<IMedia> {
  constructor() {
    super(MEDIA_TABLE_NAME);
  }

  async getAllEventMedia(eventId: string, pagination: Partial<IPaginationParams> = {}) {
    const { data: eventMedia, error: eventMediaError } = await this.supabaseClient
      .from(MEDIA_EVENT_JUNCTION_TABLE_NAME)
      .select("mediaId")
      .eq("eventId", eventId);

    if (eventMediaError) return { error: eventMediaError };
    const { data, error } = await super.getAll(
      {
        select: `*`,
        modifyQuery: (qb) => qb.in("id", eventMedia?.map((media) => media.mediaId) || [])
      },
      pagination
    );

    if (error) return { error };

    const formattedData = (data?.items || []).map((item) => ({
      eventId: (item as IMedia & { eventId: string }).eventId,
      ...item
    }));

    return {
      data: {
        items: formattedData,
        pagination: data!.pagination
      },
      error
    };
  }

  async uploadFile({
    uploadPath,
    bucket,
    fileUri,
    mimeType,
    options
  }: {
    fileUri: string;
    uploadPath: string;
    bucket: string;
    mimeType: string;
    options?: Record<string, any>;
  }) {
    return validateMediaCreate({ uploadPath, bucket, fileUri, mimeType, options }, async () => {
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64
      });

      const { data, error } = await this.supabaseService.uploadFile({
        bucket,
        base64FileData: base64,
        mimeType,
        path: uploadPath,
        options
      });

      if (error) {
        return { error };
      }
      const fileName = data?.path.split("/").pop() || "";

      // create media record
      return this.create({
        storage: {
          metadata: data,
          path: data.fullPath,
          provider: EMediaProvider.Supabase
        },
        metadata: { ...data, ...options?.metadata },
        mimeType,
        name: fileName,
        ...options
      });
    });
  }

  async deleteFile(path: string) {
    const { error } = await this.supabaseService.deleteFile({
      bucket: MEDIA_FILE_BUCKET_NAME,
      paths: [path]
    });
    if (error) return { error };
    return { data: { path, deleted: true }, error: null };
  }

  async update<U extends Partial<IMedia>>(id: string, data: U, useTransaction?: boolean) {
    return validateMediaUpdate(data, () => super.update(id, data, useTransaction));
  }
}

export default MediaService;
