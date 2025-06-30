import { IBaseUser, IEvent, IPaginationParams } from "@/definitions/types";
import ThreadsService from "../threads/service";
import {
  createRecord,
  deleteRecord,
  findAllWithPagination,
  runTransaction,
  updateRecord,
} from "@utils/dbUtils";
import { Op } from "sequelize";
import {
  EAccessLevel,
  EEventParticipantStatus,
  EEventStatus,
  EThreadType,
} from "@/definitions/enums";
import TagService from "../tags/service";
import MediaService from "../media/service";
import UserService from "../users/service";
import ReactionService from "../reactions/service";
import { validateEventCreate, validateEventUpdate } from "./validation";
import { MethodCacheSync } from "@decorators";
import {
  getEventCache,
  getEventUsersCache,
  setEventCache,
  setEventUsersCache,
} from "./helpers";
import { deleteEventCache } from "./helpers";
import { isEmpty } from "@utils";
import { BadRequestError, NotFoundError } from "@exceptions";
import { getDistanceInMeters } from "@helpers";
import { Event } from "./model";
import { Thread } from "../threads/model";
import MessageService from "@features/messages/service";

class EventService {
  private readonly threadService: ThreadsService;
  private readonly tagService: TagService;
  private readonly mediaService: MediaService;
  private readonly userService: UserService;
  private readonly reactionService: ReactionService;
  private readonly messageService: MessageService;
  private readonly getCache = getEventCache;
  private readonly setCache = setEventCache;
  private readonly deleteCache = deleteEventCache;

  constructor() {
    this.threadService = new ThreadsService();
    this.tagService = new TagService();
    this.mediaService = new MediaService();
    this.userService = new UserService();
    this.reactionService = new ReactionService();
    this.messageService = new MessageService();
  }

  private readonly populateFields = [
    "threads",
    "tags",
    "media",
    "creator",
    "participants",
    "verifiers",
    "reactions",
  ];

  private async populateEvent(
    event: IEvent,
    fields: string[]
  ): Promise<IEvent> {
    const promises: Record<string, Promise<any>> = {};

    fields.forEach((field) => {
      switch (field) {
        case "tags":
          promises.tags = this.tagService.getAllEventTags(event.id);
          break;
        case "media":
          promises.media = this.mediaService.getEventMedia(event.id);
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
          promises.reactions = this.reactionService.getReactions(
            `events/${event.id}`
          );
          break;
      }
    });

    const results = await Promise.allSettled(Object.values(promises));
    const resolved: Record<string, any> = {};
    Object.keys(promises).forEach((key, index) => {
      const res = results[index];
      resolved[key] = res.status === "fulfilled" ? res.value : null;
    });

    if (fields.includes("tags")) event.tags = resolved.tags?.data || [];
    if (fields.includes("media")) event.media = resolved.media?.data || [];
    if (fields.includes("creator"))
      event.creator = resolved.creator?.data || null;
    if (fields.includes("participants"))
      event.participants = resolved.participants || [];
    if (fields.includes("verifiers"))
      event.verifiers = resolved.verifiers || [];
    if (fields.includes("reactions"))
      event.reactions = resolved.reactions?.data || [];

    return event as any;
  }

  @MethodCacheSync<IEvent>({})
  async getById(id: string, populate?: boolean | string[]) {
    const data = await Event.findByPk(id, { raw: true });
    if (!data) return { data: null, error: null };

    if (populate) {
      const fields =
        populate === true
          ? this.populateFields
          : this.populateFields.filter((f) =>
              (populate as string[]).includes(f)
            );
      const populated = await this.populateEvent(data as IEvent, fields);
      return { data: populated, error: null };
    }

    return { data, error: null };
  }

  async getEventData(id: string) {
    return this.getById(id, true);
  }

  @MethodCacheSync<IEvent>({})
  async createEvent(body: Partial<IEvent>, populate?: boolean | string[]) {
    if (!body.status) body.status = EEventStatus.Draft;
    const result = await validateEventCreate(body, (data) =>
      createRecord(Event, data as any)
    );
    if (populate && result.data) {
      const { data: populated } = await this.getById(result.data.id, populate);
      return { data: populated, error: result.error };
    }
    return result;
  }

  @MethodCacheSync<IEvent>({})
  async update<U extends Partial<IEvent>>(
    id: string,
    data: U,
    populate?: boolean | string[]
  ) {
    const { data: existing } = await this.getById(id);
    if (existing && existing.status === EEventStatus.Cancelled) {
      throw new BadRequestError('Cannot update a cancelled event');
    }
    const result = await validateEventUpdate(data, (data) =>
      updateRecord(Event, id, data)
    );
    if (populate && !result.error) {
      const { data: populated } = await this.getById(id, populate);
      return { data: populated, error: result.error };
    }
    return result;
  }

  async getAll(
    where: Record<string, any> = {},
    pagination?: Partial<IPaginationParams>
  ) {
    if (Array.isArray(where.status)) {
      where.status = { [Op.in]: where.status };
    }
    const { data } = await findAllWithPagination(Event, where, pagination);
    if (data.items) {
      await Promise.all(
        data.items.map(async (event) => {
          const mediaPromise = this.mediaService.getEventMedia(event.id, 3);
          const tagsPromise = this.tagService.getAllEventTags(event.id);
          const participantsPromise =
            this.userService.getAndPopulateUserProfiles({
              data: event.participants,
              searchKey: "user",
            });
          const verifiersPromise = this.userService.getAndPopulateUserProfiles({
            data: event.verifiers,
            searchKey: "user",
          });
          const reactionsPromise = this.reactionService.getReactions(
            `events/${event.id}`
          );
          const [media, tags, participants, verifiers, reactions] =
            await Promise.all([
              mediaPromise,
              tagsPromise,
              participantsPromise,
              verifiersPromise,
              reactionsPromise,
            ]);
          event.media = media.data || [];
          event.tags = tags.data || [];
          event.participants = participants || [];
          event.verifiers = verifiers || [];
          event.reactions = reactions.data || [];
        })
      );

      data.items = await this.userService.getAndPopulateUserProfiles({
        data: data.items,
        searchKey: "createdBy",
        populateKey: "creator",
      });
    }
    return { data, error: null };
  }

  @MethodCacheSync<IEvent>({})
  async cancel(id: string) {
    const result = await updateRecord(Event, id, {
      status: EEventStatus.Cancelled,
    });
    await this.deleteCache(id);
    return result;
  }

  @MethodCacheSync<IEvent>({})
  delete(id: string) {
    return deleteRecord(Event, id);
  }

  @MethodCacheSync<Record<string, IBaseUser>>({
    cacheGetter: getEventUsersCache,
    cacheSetter: setEventUsersCache,
    customCacheKey: (...args) => `${args[0]}:${args[1]}`,
  })
  async getEventUsers(
    eventId: string,
    type: "participants" | "verifiers",
    userIds: string[]
  ) {
    const { data } = await this.userService.getAll(
      { id: userIds },
      { limit: 1000 },
      "id,name,email,deletedAt"
    );
    const userMap = data.items?.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as Record<string, IBaseUser>);

    return { data: userMap, error: null, type, eventId };
  }

  async verifyEvent(
    userId: string,
    eventId: string,
    currentCoordinates: {
      latitude: number;
      longitude: number;
    }
  ) {
    const { data } = await this.getById(eventId);
    const { latitude, longitude } = currentCoordinates;
    const { latitude: eventLatitude, longitude: eventLongitude } =
      data.location.coordinates;
    const distance = getDistanceInMeters(
      latitude,
      longitude,
      eventLatitude,
      eventLongitude
    );
    if (distance > 50) {
      throw new BadRequestError(
        `You are too far from the event. Current distance ${distance.toFixed(
          2
        )} meters`
      );
    }
    const updateData = {
      verifiers: [...data.verifiers],
    };
    const verifierIndex = updateData.verifiers.findIndex(
      (verifier) => verifier.user === userId
    );
    if (verifierIndex === -1) {
      updateData.verifiers.push({
        user: userId,
        verifiedAt: new Date().toISOString(),
      });
    } else {
      throw new BadRequestError("You are already a verifier");
    }

    return this.update(eventId, updateData);
  }

  async joinLeaveEvent(
    userId: string,
    eventId: string,
    action: "join" | "leave"
  ) {
    const [event, user] = await Promise.all([
      this.getById(eventId),
      this.userService.getById(userId),
    ]);

    if (event.error || user.error)
      throw new Error((event.error || user.error) as any);

    const eventData = event.data;
    const userData = user.data;

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
    } else if (action === "leave") {
      const participantIndex = updateData.participants.findIndex(
        (participant) => participant.user === userData.id
      );

      if (participantIndex === -1) {
        throw new BadRequestError("User is not a participant");
      }

      updateData.participants[participantIndex].status =
        EEventParticipantStatus.Declined;
    } else {
      throw new BadRequestError("Invalid action");
    }
    await this.update(eventId, updateData);
    return {
      data: `Successfully ${action === "join" ? "joined" : "left"} the event`,
      error: null,
    };
  }

  async associateMediaToEvent(eventId: string, mediaId: string) {
    const [event, media, eventMedia] = await Promise.all([
      this.getById(eventId),
      this.mediaService.getById(mediaId),
      this.mediaService.getEventMediaJunctionRow(eventId, mediaId),
    ]);

    if (event.error || media.error)
      throw new Error((event.error || media.error) as any);

    if (!isEmpty(eventMedia.data))
      throw new BadRequestError("Media is already associated to this event");

    if (isEmpty(event.data) || isEmpty(media.data))
      throw new NotFoundError("Event or media not found");

    return this.mediaService.createEventMediaJunctionRow(eventId, mediaId);
  }

  async deleteEventMedia(eventId: string, mediaId: string) {
    return this.mediaService.deleteEventMediaJunctionRow(eventId, mediaId);
  }

  async getThreads(eventId: string, pagination: IPaginationParams) {
    const { data, error } = await this.threadService.getAll(
      { eventId },
      pagination
    );
    let threads = data.items;
    if (!isEmpty(threads)) {
      await Promise.all(
        threads.map(async (t) => {
          const messages = await this.messageService.getAll(
            { threadId: t.id },
            { limit: 1 }
          );
          t.messages = messages.data.items || [];
        })
      );
    }
    return {
      data: { items: threads, pagination: data.pagination },
      error,
    };
  }
}

export default EventService;
