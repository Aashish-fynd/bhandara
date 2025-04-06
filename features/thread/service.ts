import { IDiscussionThread, IQnAThread } from "@/definitions/types/global";
import Base, { BaseQueryArgs } from "../Base";
import MessageService from "../message/service";
import { EQueryOperator } from "@/definitions/enums";
import { PostgrestError } from "@supabase/supabase-js";
import { validateThreadCreate, validateThreadUpdate } from "./validation";

class ThreadsService extends Base<IDiscussionThread | IQnAThread> {
  public static TABLE_NAME = "Threads";

  private readonly messageService: MessageService;
  constructor() {
    super(ThreadsService.TABLE_NAME);
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
