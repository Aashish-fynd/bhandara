import { Worker } from 'bullmq';
import redis from '@/connections/redis';
import { VIDEO_QUEUE_NAME } from '@/queues/video';
import MediaService from '@/features/media/service';
import EventService from '@/features/events/service';
import { Event } from '@/features/events/model';
import { Op } from 'sequelize';
import { emitSocketEvent } from '@/socket/emitter';
import { PLATFORM_SOCKET_EVENTS } from '@/constants';
import logger from '@/logger';
import { tmpdir } from 'os';
import path from 'path';
import fs from 'fs/promises';
import { spawn } from 'child_process';

const mediaService = new MediaService();
const eventService = new EventService();

const runFFmpeg = (args: string[]) =>
  new Promise<void>((resolve, reject) => {
    const p = spawn('ffmpeg', args);
    p.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
  });

export default new Worker(
  VIDEO_QUEUE_NAME,
  async (job) => {
    const { mediaId } = job.data as { mediaId: string };
    try {
      const media = await mediaService.getById(mediaId);
      if (!media) return;

      const { signedUrl } = await mediaService.getPublicUrl(
        media.url,
        media.storage.bucket,
        media.storage.provider
      );
      const input = path.join(tmpdir(), `${mediaId}${path.extname(media.url)}`);
      const res = await fetch(signedUrl);
      await fs.writeFile(input, Buffer.from(await res.arrayBuffer()));

      const out3x = path.join(tmpdir(), `${mediaId}@3x.gif`);
      const out2x = path.join(tmpdir(), `${mediaId}@2x.gif`);
      const out1x = path.join(tmpdir(), `${mediaId}@1x.gif`);

      await runFFmpeg(['-y', '-i', input, '-vf', 'scale=480:-1', out3x]);
      await runFFmpeg(['-y', '-i', out3x, '-vf', 'scale=320:-1', out2x]);
      await runFFmpeg(['-y', '-i', out3x, '-vf', 'scale=160:-1', out1x]);

      const upload = async (file: string, suffix: string) => {
        const signed = await mediaService.getSignedUrlForPublicUpload({
          path: `${mediaId}${suffix}.gif`,
        });
        await mediaService.uploadFileToSignedUrl({
          bucket: signed.bucket ?? 'public',
          path: signed.path,
          base64FileData: (await fs.readFile(file)).toString('base64'),
          mimeType: 'image/gif',
          token: signed.token,
        });
        return signed.path;
      };

      const [t1, t2, t3] = await Promise.all([
        upload(out1x, '@1x'),
        upload(out2x, '@2x'),
        upload(out3x, '@3x'),
      ]);

      await mediaService.update(mediaId, {
        thumbnail: t2,
        metadata: {
          ...(media.metadata || {}),
          thumbnails: { '@1x': t1, '@2x': t2, '@3x': t3 },
        },
      });

      await fs.unlink(input).catch(() => {});
      await fs.unlink(out1x).catch(() => {});
      await fs.unlink(out2x).catch(() => {});
      await fs.unlink(out3x).catch(() => {});

      const events = await Event.findAll({
        where: { media: { [Op.contains]: [mediaId] } },
        raw: true,
      });

      for (const e of events) {
        const event = await eventService.getEventData((e as any).id);
        emitSocketEvent(PLATFORM_SOCKET_EVENTS.EVENT_UPDATED, { data: event });
      }
    } catch (err) {
      logger.error('Video worker error', err);
    }
  },
  { connection: redis }
);
