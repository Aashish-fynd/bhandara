import { IDiscussionThread, IQnAThread } from "@/definitions/types";
import Base from "../Base";
import MessageService from "../messages/service";
import { validateThreadCreate, validateThreadUpdate } from "./validation";
import { THREAD_TABLE_NAME } from "./constants";
import MediaService from "@features/media/service";
import { PostgrestError } from "@supabase/postgrest-js";
import { EQueryOperator, EThreadType } from "@definitions/enums";
import { MethodCacheSync } from "@decorators";
import { getThreadCache, setThreadCache, deleteThreadCache } from "./helpers";

class ThreadsService extends Base<IDiscussionThread | IQnAThread> {
  private readonly messageService: MessageService;
  private readonly mediaService: MediaService;
  private readonly getCache = getThreadCache;
  private readonly setCache = setThreadCache;
  private readonly deleteCache = deleteThreadCache;

  constructor() {
    super(THREAD_TABLE_NAME);
    this.messageService = new MessageService();
  }

  async _getByIdNoCache(id: string) {
    return super.getById(id);
  }

  @MethodCacheSync<IDiscussionThread | IQnAThread>({})
  async create<
    U extends Partial<Omit<IDiscussionThread | IQnAThread, "id" | "updatedAt">>
  >(data: U) {
    return validateThreadCreate(data, (data) => super.create(data));
  }

  @MethodCacheSync<IDiscussionThread | IQnAThread>({})
  async getById(
    id: string,
    includeMessages?: boolean
  ): Promise<{
    data: IDiscussionThread | IQnAThread;
    error: PostgrestError | null;
  }> {
    const { data: thread } = await super.getById(id);
    if (includeMessages) {
      const messages = await this.messageService.getAll({
        query: [{ column: "threadId", operator: EQueryOperator.Eq, value: id }],
      });

      if (thread.type === EThreadType.Discussion) {
        (thread as IDiscussionThread).messages = messages.data.items;
      } else if (thread.type === EThreadType.QnA) {
        (thread as IQnAThread).qaPairs = messages.data.items.map((item) => {
          const { children, ...question } = item;
          return {
            question,
            answers: children.items,
          };
        });
      }
    }

    return { data: thread, error: null };
  }

  @MethodCacheSync<IDiscussionThread | IQnAThread>({})
  async update<U extends Partial<IDiscussionThread | IQnAThread>>(
    id: string,
    data: U
  ) {
    return validateThreadUpdate(data, (data) => super.update(id, data));
  }
}

export default ThreadsService;
