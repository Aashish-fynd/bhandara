import {
  IDiscussionThread,
  IEvent,
  IQnAThread,
} from "@/definitions/types/global";
import Base from "@/services/Base";
import { MessageService, ThreadsService } from "@/services/index";

class EventService {
  public static readonly TABLE_NAME = "Events";
  private readonly threadService: ThreadsService;
  private readonly messageService: MessageService;
  private readonly baseService: Base<IEvent>;

  constructor() {
    this.baseService = new Base<IEvent>(EventService.TABLE_NAME);
    this.threadService = new ThreadsService();
    this.messageService = new MessageService();
  }

  async getEventData(
    id: string
  ): Promise<{
    data?: { event: IEvent; thread: IDiscussionThread | IQnAThread } | null;
    error: any;
  }> {
    const { data, error } = await this.baseService.getById(id);
    if (error) {
      return { error };
    }
    if (!data) {
      return { error: "Event not found" };
    }
    const threadData = await this.threadService.getById(
      (data as IEvent).id || ""
    );
    if (threadData.error) {
      return { error: threadData.error };
    }

    if (!threadData.data) {
      return { error: "Thread not found" };
    }

    const messages = await this.messageService.getAll({
      query: [
        {
          value: threadData.data?.id || "",
          operator: "eq",
          column: "thread_id",
        },
      ],
    });
    if (messages?.error) {
      return { error: messages.error };
    }
    const thread = {
      ...threadData.data,
      messages: messages.data || [],
    };

    return { data: { event: data as IEvent, thread: thread }, error };
  }

  async createEvent(): Promise<{
    data?: IEvent | null;
    error: any;
  }> {
    
  }
}

export default EventService;
