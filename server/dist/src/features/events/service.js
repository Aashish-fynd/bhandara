import ThreadsService from "../threads/service";
import { findAllWithPagination } from "@utils/dbUtils";
import { Op } from "sequelize";
import { EEventParticipantStatus, EEventStatus } from "@/definitions/enums";
import TagService from "../tags/service";
import MediaService from "../media/service";
import UserService from "../users/service";
import ReactionService from "../reactions/service";
import { validateEventCreate, validateEventUpdate } from "./validation";
import { getEventCache, getEventUsersCache, setEventCache, setEventUsersCache, } from "./helpers";
import { deleteEventCache } from "./helpers";
import { isEmpty } from "@utils";
import { BadRequestError, NotFoundError } from "@exceptions";
import { getDistanceInMeters } from "@helpers";
import { Event } from "./model";
import MessageService from "@features/messages/service";
class EventService {
    threadService;
    tagService;
    mediaService;
    userService;
    reactionService;
    messageService;
    getCache = getEventCache;
    setCache = setEventCache;
    deleteCache = deleteEventCache;
    constructor() {
        this.threadService = new ThreadsService();
        this.tagService = new TagService();
        this.mediaService = new MediaService();
        this.userService = new UserService();
        this.reactionService = new ReactionService();
        this.messageService = new MessageService();
    }
    populateFields = [
        "threads",
        "tags",
        "media",
        "creator",
        "participants",
        "verifiers",
        "reactions",
    ];
    async populateEvent(event, populate) {
        const promises = {};
        let fields = [];
        if (populate) {
            fields =
                populate === true
                    ? this.populateFields
                    : this.populateFields.filter((f) => populate.includes(f));
        }
        fields.forEach((field) => {
            switch (field) {
                case "tags":
                    promises.tags = this.tagService.getAllEventTags(event);
                    break;
                case "media":
                    promises.media = this.mediaService.getEventMedia(event);
                    break;
                case "creator":
                    promises.creator = this.userService.getById(event.createdBy);
                    break;
                case "participants":
                    promises.participants = this.userService.getAndPopulateUserProfiles({
                        data: event.participants,
                        searchKey: "user",
                    });
                    break;
                case "verifiers":
                    promises.verifiers = this.userService.getAndPopulateUserProfiles({
                        data: event.verifiers,
                        searchKey: "user",
                    });
                    break;
                case "reactions":
                    promises.reactions = this.reactionService.getReactions(`events/${event.id}`);
                    break;
            }
        });
        const results = await Promise.allSettled(Object.values(promises));
        const resolved = {};
        Object.keys(promises).forEach((key, index) => {
            const res = results[index];
            resolved[key] = res.status === "fulfilled" ? res.value : null;
        });
        if (fields.includes("tags"))
            event.tags = resolved.tags || [];
        if (fields.includes("media"))
            event.media = resolved.media || [];
        if (fields.includes("creator"))
            event.creator = resolved.creator || null;
        if (fields.includes("participants"))
            event.participants = resolved.participants || [];
        if (fields.includes("verifiers"))
            event.verifiers = resolved.verifiers || [];
        if (fields.includes("reactions"))
            event.reactions = resolved.reactions || [];
        return event;
    }
    async getById(id) {
        const cached = await getEventCache(id);
        if (cached)
            return cached;
        const data = await Event.findByPk(id, { raw: true });
        if (!data)
            return null;
        await setEventCache(id, data);
        return data;
    }
    async getEventData(id) {
        const event = await this.getById(id);
        return this.populateEvent(event, true);
    }
    async createEvent(body) {
        if (!body.status)
            body.status = EEventStatus.Draft;
        const result = await validateEventCreate(body, async (data) => {
            const row = await Event.create(data);
            return row.toJSON();
        });
        const eventData = result;
        if (eventData) {
            await setEventCache(eventData.id, eventData);
        }
        return eventData;
    }
    async update({ existing, data, populate, }) {
        if (existing && existing.status === EEventStatus.Cancelled) {
            throw new BadRequestError("Cannot update a cancelled event");
        }
        const result = await validateEventUpdate(data, async (d) => {
            const row = await Event.findByPk(existing.id);
            if (!row)
                throw new Error("Event not found");
            await row.update(d);
            return row.toJSON();
        });
        await this.deleteCache(existing.id);
        let eventData = result;
        if (populate && eventData) {
            eventData = await this.populateEvent(eventData, populate);
        }
        return eventData;
    }
    async getAll(where = {}, pagination) {
        if (Array.isArray(where.status)) {
            where.status = { [Op.in]: where.status };
        }
        const data = await findAllWithPagination(Event, where, pagination);
        if (data.items) {
            await Promise.all(data.items.map(async (event) => {
                const mediaPromise = this.mediaService.getEventMedia(event, 3);
                const tagsPromise = this.tagService.getAllEventTags(event);
                const participantsPromise = this.userService.getAndPopulateUserProfiles({
                    data: event.participants,
                    searchKey: "user",
                });
                const verifiersPromise = this.userService.getAndPopulateUserProfiles({
                    data: event.verifiers,
                    searchKey: "user",
                });
                const reactionsPromise = this.reactionService.getReactions(`events/${event.id}`);
                const [media, tags, participants, verifiers, reactions] = await Promise.all([
                    mediaPromise,
                    tagsPromise,
                    participantsPromise,
                    verifiersPromise,
                    reactionsPromise,
                ]);
                event.media = media || [];
                event.tags = tags;
                event.participants = participants || [];
                event.verifiers = verifiers || [];
                event.reactions = reactions;
            }));
            data.items = await this.userService.getAndPopulateUserProfiles({
                data: data.items,
                searchKey: "createdBy",
                populateKey: "creator",
            });
        }
        return data;
    }
    async cancel(id) {
        const row = await Event.findByPk(id);
        if (!row)
            return null;
        await row.update({ status: EEventStatus.Cancelled });
        await this.deleteCache(id);
        return row.toJSON();
    }
    async delete(id) {
        const row = await Event.findByPk(id);
        if (!row)
            return null;
        await row.destroy();
        await this.deleteCache(id);
        return row.toJSON();
    }
    async getEventUsers(eventId, type, userIds) {
        const key = `${eventId}:${type}`;
        const cached = await getEventUsersCache(key);
        if (cached)
            return { users: cached, type, eventId };
        const { items } = await this.userService.getAll({ id: userIds }, { limit: 1000 }, "id,name,email,deletedAt");
        const userMap = items?.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
        }, {});
        await setEventUsersCache(key, userMap);
        return { users: userMap, type, eventId };
    }
    async verifyEvent(userId, eventId, currentCoordinates) {
        const data = await this.getById(eventId);
        const { latitude, longitude } = currentCoordinates;
        const { latitude: eventLatitude, longitude: eventLongitude } = data.location;
        const distance = getDistanceInMeters(latitude, longitude, eventLatitude, eventLongitude);
        if (distance > 50) {
            throw new BadRequestError(`You are too far from the event. Current distance ${distance.toFixed(2)} meters`);
        }
        const updateData = {
            verifiers: [...data.verifiers],
        };
        const verifierIndex = updateData.verifiers.findIndex((verifier) => verifier.user === userId);
        if (verifierIndex === -1) {
            updateData.verifiers.push({
                user: userId,
                verifiedAt: new Date().toISOString(),
            });
        }
        else {
            throw new BadRequestError("You are already a verifier");
        }
        await this.update({ existing: data, data: updateData });
        await this.deleteCache(eventId);
        return true;
    }
    async joinLeaveEvent(userId, eventId, action) {
        const [event, user] = await Promise.all([
            this.getById(eventId),
            this.userService.getById(userId),
        ]);
        if (!event || !user)
            throw new NotFoundError("Event or user not found");
        const eventData = event;
        const userData = user;
        if (eventData.status !== EEventStatus.Ongoing) {
            throw new BadRequestError(`Event is ${eventData.status}`);
        }
        const updateData = {
            participants: [...eventData.participants],
        };
        if (action === "join") {
            updateData.participants.push({
                user: userData.id,
                status: EEventParticipantStatus.Confirmed,
            });
        }
        else if (action === "leave") {
            const participantIndex = updateData.participants.findIndex((participant) => participant.user === userData.id);
            if (participantIndex === -1) {
                throw new BadRequestError("User is not a participant");
            }
            updateData.participants[participantIndex].status =
                EEventParticipantStatus.Declined;
        }
        else {
            throw new BadRequestError("Invalid action");
        }
        await this.update({ existing: event, data: updateData });
        return `Successfully ${action === "join" ? "joined" : "left"} the event`;
    }
    async disassociateMediaFromEvent(eventId, mediaId) {
        const event = await this.getById(eventId);
        if (!event)
            throw new NotFoundError("Event not found");
        const media = new Set(event.media);
        if (!media.has(mediaId))
            throw new NotFoundError("Media not found");
        media.delete(mediaId);
        await this.update({
            existing: event,
            data: { media: Array.from(media) },
        });
        await this.deleteCache(eventId);
        return true;
    }
    async getThreads(eventId, pagination) {
        const { items, pagination: threadPagination } = await this.threadService.getAll({ eventId }, pagination);
        let threads = items;
        if (!isEmpty(threads)) {
            await Promise.all(threads.map(async (t) => {
                const messages = await this.messageService.getAll({ threadId: t.id }, { limit: 1 });
                t.messages = messages.items || [];
            }));
        }
        return { items: threads, pagination: threadPagination };
    }
}
export default EventService;
//# sourceMappingURL=service.js.map