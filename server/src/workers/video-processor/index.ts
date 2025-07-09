import { Job, Worker } from "bullmq";
import redis from "@/connections/redis";
import { VIDEO_QUEUE_NAME } from "@/queues/video";
import MediaService from "@/features/media/service";

import logger from "@/logger";
import { spawn } from "child_process";
import { MEDIA_PUBLIC_BUCKET_NAME } from "@features/media/constants";
import { EMediaProvider } from "@definitions/enums";

import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";

const mediaService = new MediaService();

const runFFmpegWithBuffer = (
  buffer: Buffer,
  size: number,
  format: string
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(ffmpegPath, [
      "-f",
      format,
      "-analyzeduration",
      "5000000",
      "-probesize",
      "5000000",
      "-i",
      "pipe:0",
      "-vf",
      `scale=${size}:-1`,
      "-vcodec",
      "libwebp",
      "-f",
      "webp",
      "pipe:1",
    ]);

    const chunks: Buffer[] = [];
    ffmpeg.stdout.on("data", (chunk) => chunks.push(chunk));
    ffmpeg.stdout.on("end", () => resolve(Buffer.concat(chunks)));
    ffmpeg.stderr.on("data", (data) => console.error(`ffmpeg stderr: ${data}`));
    ffmpeg.on("error", reject);
    ffmpeg.on("close", (code) => {
      if (code !== 0) reject(new Error(`ffmpeg exited with code ${code}`));
    });

    ffmpeg.stdin.write(buffer);
    ffmpeg.stdin.end();
  });
};

export const processor = async (job: Job) => {
  const { mediaId, eventId } = job.data as { mediaId: string; eventId: string };
  try {
    const media = await mediaService.getById(mediaId);
    if (!media) return;

    const { signedUrl } = await mediaService.getPublicUrl(
      media.url,
      media.storage.bucket,
      media.storage.provider,
      { download: true }
    );

    const res = await fetch(signedUrl);
    if (!res.ok || !res.body) throw new Error("Failed to fetch media stream");
    const buffer = Buffer.from(await res.arrayBuffer());
    const sizes = { "@1x": 160, "@2x": 320, "@3x": 480 };

    const thumbBuffers: Record<string, Buffer> = {};
    await Promise.all(
      Object.entries(sizes).map(async ([suffix, size]) => {
        const output = await runFFmpegWithBuffer(
          buffer,
          size,
          "mp4" || media.mimeType.split("/")[1]
        );
        if (output.toString("base64")) {
          thumbBuffers[suffix] = output;
        } else {
          delete sizes[suffix];
        }
      })
    );

    const uploaded = await Promise.all(
      Object.entries(thumbBuffers).map(([suffix, buffer]) =>
        mediaService.uploadFile({
          bucket: MEDIA_PUBLIC_BUCKET_NAME,
          path: `${eventId}/${mediaId}${suffix}.webp`,
          file: buffer.toString(),
          mimeType: "image/webp",
          provider: EMediaProvider.Supabase,
          options: {},
        })
      )
    );

    const mappedThumbs = Object.keys(sizes).reduce((acc, suffix, i) => {
      acc[suffix] = uploaded[i];
      return acc;
    }, {} as Record<string, any>);

    if (Object.keys(mappedThumbs).length === 0) {
      logger.error("No thumbnails generated", { mediaId, eventId });
      return true;
    }

    await mediaService.update(mediaId, {
      thumbnail:
        "@2x" in mappedThumbs
          ? mappedThumbs["@2x"].path
          : Object.values(mappedThumbs)[0]?.path,
      metadata: {
        ...(media.metadata || {}),
        thumbnails: mappedThumbs,
        eventId,
      },
    });
    logger.info("Video worker completed", { mediaId, eventId });
    return true;
  } catch (err) {
    logger.error("Video worker error", { mediaId, eventId, err });
    return false;
  }
};

export default new Worker(VIDEO_QUEUE_NAME, processor, { connection: redis });
processor({
  data: {
    mediaId: "0197e0c9-e287-74a0-b382-c1c647fc8f28",
    eventId: "0197db48-d421-711d-b69d-f14d41df76e1",
  },
} as any);
