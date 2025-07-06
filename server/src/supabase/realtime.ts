import supabase from './index';
import { Event } from '@/features/events/model';
import EventService from '@/features/events/service';
import { Op } from 'sequelize';
import { emitSocketEvent } from '@/socket/emitter';
import { PLATFORM_SOCKET_EVENTS } from '@/constants';
import logger from '@/logger';

export function initializeMediaRealtime() {
  const channel = supabase.channel('media-updates');
  const eventService = new EventService();
  channel
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'Media' },
      async (payload) => {
        const mediaId = payload.new.id as string;
        try {
          const events = await Event.findAll({
            where: { media: { [Op.contains]: [mediaId] } },
            raw: true,
          });
          for (const e of events) {
            const ev = await eventService.getEventData((e as any).id);
            emitSocketEvent(PLATFORM_SOCKET_EVENTS.EVENT_UPDATED, { data: ev });
          }
        } catch (err) {
          logger.error('Realtime handler error', err);
        }
      }
    )
    .subscribe()
    .catch((e) => logger.error('Realtime subscribe error', e));
}
