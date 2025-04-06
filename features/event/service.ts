import {
  IBaseUser,
  IDiscussionThread,
  IEvent,
  IQnAThread
} from "@/definitions/types/global";
import ThreadsService from "../thread/service";
import MessageService from "../message/service";
import Base from "../Base";
import { EQueryOperator, EThreadType } from "@/definitions/enums";
import TagService from "../tag/service";
import MediaService from "../media/service";
import UserService from "../user/service";
import { validateEventCreate, validateEventUpdate } from "./validation";

class EventService extends Base<IEvent> {
  public static readonly TABLE_NAME = "Events";
  private readonly threadService: ThreadsService;
  private readonly messageService: MessageService;
  private readonly tagService: TagService;
  private readonly mediaService: MediaService;
  private readonly userService: UserService;

  constructor() {
    super(EventService.TABLE_NAME);
    this.threadService = new ThreadsService();
    this.messageService = new MessageService();
    this.tagService = new TagService();
    this.mediaService = new MediaService();
    this.userService = new UserService();
  }

  async getEventData(id: string): Promise<{
    data?: {
      event: IEvent;
      qnaThread?: { thread: IQnAThread[]; messages: any[] };
      discussionThread?: { thread: IDiscussionThread[]; messages: any[] };
    } | null;
    error: any;
  }> {
    // Fetch the event data
    const { data: eventData, error: eventError } = await this.getById(id);
    if (eventError) {
      return { error: eventError };
    }
    if (!eventData) {
      return { error: "Event not found" };
    }

    // Fetch thread data
    const threadData = await this.threadService.getAll({
      query: [
        {
          value: eventData.id || "",
          operator: EQueryOperator.Eq,
          column: "eventId"
        }
      ]
    });

    if (threadData.error) {
      return { error: threadData.error };
    }
    if (!threadData.data) {
      return { error: "Thread not found" };
    }

    // Separate QnA and Discussion threads
    const qnaThread = threadData.data.items?.filter(
      (thread) => thread.type === EThreadType.QnA
    );

    const discussionThread = threadData.data.items?.filter(
      (thread) => thread.type === EThreadType.Discussion
    );

    // Create promises for fetching related data
    const promises: Record<string, Promise<any>> = {};

    // there will always be only one qna thread and one discussion thread
    if (qnaThread?.length! > 0) {
      promises.qnaMessages = this.messageService.getAll({
        query: [
          {
            value: qnaThread[0].id || "",
            operator: EQueryOperator.Eq,
            column: "threadId"
          }
        ]
      });
    }

    if (discussionThread?.length! > 0) {
      promises.discussionMessages = this.messageService.getAll({
        query: [
          {
            value: discussionThread[0].id || "",
            operator: EQueryOperator.Eq,
            column: "threadId"
          }
        ]
      });
    }

    promises.tags = this.tagService.getAllEventTags(id);
    promises.media = this.mediaService.getAllEventMedia(id);

    // Wait for all promises to settle
    const settledResults = await Promise.allSettled(Object.values(promises));

    const userIds = eventData.participants.flatMap(
      (participant) => participant.userId
    );
    userIds.push(...eventData.verifiers);

    const { data: userProfiles, error } = await this.userService.getAll({
      select: "name,email,id",
      query: [
        {
          value: userIds as string[],
          operator: EQueryOperator.In,
          column: "id"
        }
      ]
    });

    if (error) return { error: error };

    eventData.participants = eventData?.participants.map((participant) => ({
      ...participant,
      user: userProfiles?.items.find((user) => user.id === participant.userId)
    }));
    eventData.verifiers = eventData.verifiers.map((verifier) => ({
      ...userProfiles?.items.find((user) => user.id === verifier)
    })) as IBaseUser[];

    // Map results back to their keys
    const resolvedData: Record<string, any> = {};
    Object.keys(promises).forEach((key, index) => {
      const result = settledResults[index];
      resolvedData[key] = result.status === "fulfilled" ? result.value : null;
      if (result.status === "rejected") {
        console.error(`Error fetching ${key}:`, result.reason);
        return { error: result.reason };
      }
    });

    eventData.tags = resolvedData.tags?.data || [];
    eventData.media = resolvedData.media?.data || [];

    // Construct the final response
    return {
      data: {
        event: eventData,
        qnaThread: {
          thread: qnaThread || [],
          messages: resolvedData.qnaMessages?.data || []
        },
        discussionThread: {
          thread: discussionThread || [],
          messages: resolvedData.discussionMessages?.data || []
        }
      },
      error: null
    };
  }

  async createEvent({
    body,
    tagIds,
    mediaIds
  }: {
    body: Partial<IEvent>;
    tagIds: string[];
    mediaIds: string[];
  }) {
    return validateEventCreate(body, (data) =>
      super.supabaseClient.rpc("create_event", {
        event_data: data,
        tag_ids: tagIds,
        media_ids: mediaIds
      })
    );
  }

  async update<U extends Partial<IEvent>>(id: string, data: U) {
    return validateEventUpdate(data, (data) =>
      super.supabaseClient.rpc("update_event", {
        event_id: id,
        event_data: data
      })
    );
  }
}

export default EventService;
