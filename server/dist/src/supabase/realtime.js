import { Event } from "@/features/events/model";
import EventService from "@/features/events/service";
import { emitSocketEvent } from "@/socket/emitter";
import { PLATFORM_SOCKET_EVENTS } from "@/constants";
import logger from "@/logger";
import { supabase } from "@connections";
import { MEDIA_TABLE_NAME } from "@features/media/constants";
const eventService = new EventService();
export function initializeMediaRealtime() {
    const channel = supabase
        .channel("table-db-changes")
        .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: MEDIA_TABLE_NAME,
    }, async (payload) => {
        const eventId = payload.new.metadata?.eventId;
        if (!eventId)
            return;
        try {
            const events = await Event.findAll({
                where: { id: eventId },
                raw: true,
            });
            for (const e of events) {
                const ev = await eventService.getEventData(e.id);
                emitSocketEvent(PLATFORM_SOCKET_EVENTS.EVENT_UPDATED, { data: ev });
            }
        }
        catch (err) {
            logger.error("Realtime handler error", err);
        }
    })
        .subscribe();
    return channel;
}
//# sourceMappingURL=realtime.js.map