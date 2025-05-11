import { IDiscussionThread, IQnAThread } from "@/definitions/types";
import Base from "../Base";
import MessageService from "../messages/service";
import { validateThreadCreate, validateThreadUpdate } from "./validation";
import { THREAD_TABLE_NAME } from "./constants";
import MediaService from "@features/media/service";
import { PostgrestError } from "@supabase/postgrest-js";
import { EQueryOperator } from "@definitions/enums";
class ThreadsService extends Base<IDiscussionThread | IQnAThread> {
  private readonly messageService: MessageService;
  private readonly mediaService: MediaService;

  constructor() {
    super(THREAD_TABLE_NAME);
    this.messageService = new MessageService();
  }

  async create<
    U extends Partial<Omit<IDiscussionThread | IQnAThread, "id" | "updatedAt">>
  >(data: U) {
    return validateThreadCreate(data, (data) => super.create(data));
  }

  async getById(
    id: string,
    includeMessages?: boolean
  ): Promise<{
    data: IDiscussionThread | IQnAThread;
    error: PostgrestError | null;
  }> {
    const thread = await super.getById(id);
    if (includeMessages) {
      const messages = await this.messageService.getAll({
        query: [{ column: "threadId", operator: EQueryOperator.Eq, value: id }],
      });
      thread.data.messages = messages.data;
    }
    return thread;
  }

  async update<U extends Partial<IDiscussionThread | IQnAThread>>(
    id: string,
    data: U
  ) {
    return validateThreadUpdate(data, (data) => super.update(id, data));
  }
}

export default ThreadsService;
