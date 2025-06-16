import { IBaseUser, IEvent, IPaginationParams } from "@/definitions/types";
import ThreadsService from "../threads/service";
import {
  deleteRecord,
  findAllWithPagination,
  runTransaction,
  updateRecord,
} from "@utils/dbUtils";
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

class EventService {
  private readonly threadService: ThreadsService;
  private readonly tagService: TagService;
  private readonly mediaService: MediaService;
  private readonly userService: UserService;
  private readonly reactionService: ReactionService;
  private readonly getCache = getEventCache;
  private readonly setCache = setEventCache;
  private readonly deleteCache = deleteEventCache;

  constructor() {
    this.threadService = new ThreadsService();
    this.tagService = new TagService();
    this.mediaService = new MediaService();
    this.userService = new UserService();
    this.reactionService = new ReactionService();
  }

  @MethodCacheSync<IEvent>({})
  async getById(id: string) {
    const data = await Event.findByPk(id, { raw: true });
    return { data, error: null };
  }

  async getEventData(id: string): Promise<{
    data?:
      | (IEvent & {
          threads: {
            qna: string;
            discussion: string;
          };
        })
      | null;
    error: any;
  }> {
    // Fetch the event data
    const { data: eventData } = await this.getById(id);

    if (isEmpty(eventData)) throw new NotFoundError("Event not found");

    // TODO: if thread takes too much time move into separate call
    // Fetch thread data
    const threadData = await this.threadService.getAll({
      eventId: eventData.id || "",
    });

    if (threadData.error) throw new Error(threadData.error as any);

    if (isEmpty(threadData.data))
      throw new NotFoundError("No thread found for this event");

    // Separate QnA and Discussion threads
    const qnaThread = threadData.data.items?.filter(
      (thread) => thread.type === EThreadType.QnA
    )?.[0];

    const discussionThread = threadData.data.items?.filter(
      (thread) => thread.type === EThreadType.Discussion
    )?.[0];

    // Create promises for fetching related data
    const promises: Record<string, Promise<any>> = {};

    promises.tags = this.tagService.getAllEventTags(id);
    promises.media = this.mediaService.getEventMedia(id);
    promises.creator = this.userService.getById(eventData.createdBy);

    promises.participants = this.userService.getAndPopulateUserProfiles(
      eventData.participants,
      "user"
    );

    promises.verifiers = this.userService.getAndPopulateUserProfiles(
      eventData.verifiers,
      "user"
    );
    promises.reactions = this.reactionService.getReactions(`events/${id}`);

    // Wait for all promises to settle
    const settledResults = await Promise.allSettled(Object.values(promises));

    // Map results back to their keys
    const resolvedData: Record<string, any> = {};
    Object.keys(promises).forEach((key, index) => {
      const result = settledResults[index];
      resolvedData[key] = result.status === "fulfilled" ? result.value : null;
      if (result.status === "rejected") {
        throw result.reason;
      }
    });

    eventData.tags = resolvedData.tags?.data || [];
    eventData.media = resolvedData.media?.data || [];
    eventData.creator = resolvedData.creator?.data || null;
    eventData.participants = resolvedData.participants || [];
    eventData.verifiers = resolvedData.verifiers || [];
    eventData.reactions = resolvedData.reactions?.data || [];

    // Construct the final response
    return {
      data: {
        ...eventData,
        threads: {
          qna: qnaThread?.id,
          discussion: discussionThread?.id,
        },
      },
      error: null,
    };
  }

  @MethodCacheSync<IEvent>({})
  async createEvent({
    body,
    tagIds,
    mediaIds,
  }: {
    body: Partial<IEvent>;
    tagIds: string[];
    mediaIds: string[];
  }) {
    return validateEventCreate(body, (data) =>
      runTransaction(async (tx) => {
        const event = await Event.create(
          { ...(data as any), tags: tagIds, media: mediaIds },
          { transaction: tx }
        );

        await Thread.bulkCreate(
          [
            {
              type: EThreadType.QnA,
              status: EAccessLevel.Public,
              visibility: EAccessLevel.Public,
              eventId: event.id,
              lockHistory: [],
            },
            {
              type: EThreadType.Discussion,
              status: EAccessLevel.Public,
              visibility: EAccessLevel.Public,
              eventId: event.id,
              lockHistory: [],
            },
          ],
          { transaction: tx }
        );

        // tags and media are already stored on Event
        return { data: event, error: null };
      })
    );
  }

  @MethodCacheSync<IEvent>({})
  async update<U extends Partial<IEvent>>(id: string, data: U) {
    return validateEventUpdate(data, (data) => updateRecord(Event, id, data));
  }

  async getAll(
    where: Record<string, any> = {},
    pagination?: Partial<IPaginationParams>
  ) {
    const { data } = await findAllWithPagination(Event, where, pagination);
    if (data.items) {
      await Promise.all(
        data.items.map(async (event) => {
          const mediaPromise = this.mediaService.getEventMedia(event.id, 3);
          const tagsPromise = this.tagService.getAllEventTags(event.id);
          const participantsPromise =
            this.userService.getAndPopulateUserProfiles(
              event.participants,
              "user"
            );
          const verifiersPromise = this.userService.getAndPopulateUserProfiles(
            event.verifiers,
            "user"
          );
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

      data.items = await this.userService.getAndPopulateUserProfiles(
        data.items,
        "createdBy",
        "creator"
      );
    }
    return { data, error: null };
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
}

export default EventService;
