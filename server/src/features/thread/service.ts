import { IDiscussionThread, IQnAThread } from "@/definitions/types";
import Base from "../Base";
import MessageService from "../message/service";
import { validateThreadCreate, validateThreadUpdate } from "./validation";
import { THREAD_TABLE_NAME } from "./constants";
class ThreadsService extends Base<IDiscussionThread | IQnAThread> {
  private readonly messageService: MessageService;
  constructor() {
    super(THREAD_TABLE_NAME);
    this.messageService = new MessageService();
  }

  async create<
    U extends Partial<Omit<IDiscussionThread | IQnAThread, "id" | "updatedAt">>
  >(data: U, useTransaction?: boolean) {
    return validateThreadCreate(data, (data) =>
      super.create(data, useTransaction)
    );
  }

  async update<U extends Partial<IDiscussionThread | IQnAThread>>(
    id: string,
    data: U
  ) {
    return validateThreadUpdate(data, (data) => super.update(id, data));
  }
}

export default ThreadsService;
