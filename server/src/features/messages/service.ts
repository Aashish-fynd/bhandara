import { IMessage, IPaginationParams } from "@/definitions/types";
import Base, { BaseQueryArgs } from "../Base";
import { EQueryOperator } from "@/definitions/enums";
import { validateMessageCreate, validateMessageUpdate } from "./validation";
import { MESSAGE_TABLE_NAME } from "./constants";

class MessageService extends Base<IMessage> {
  constructor() {
    super(MESSAGE_TABLE_NAME);
  }

  async getAll(
    args: BaseQueryArgs<IMessage> = {},
    pagination: Partial<IPaginationParams> = {}
  ) {
    args.query?.push({
      value: null,
      operator: EQueryOperator.Eq,
      column: "parentId",
    });
    // Step 1: Fetch parent threads with pagination
    const { data: parentLevelMessages, error } = await super.getAll(
      {
        ...args,
      },
      pagination
    );

    if (error) return { error };

    // Step 2: Fetch total count of parent threads for pagination metadata
    const childMessagesPromises = (parentLevelMessages?.items || [])?.map((m) =>
      this.getChildren(m.id, { limit: 1 })
    );

    const childMessages = await Promise.all(childMessagesPromises);

    // Using the same index ensures each child is matched with its correct parent
    const messagesWithChildren = parentLevelMessages?.items?.map(
      (parent, index) => ({
        ...parent,
        children: childMessages[index]?.data || [],
      })
    );

    return {
      data: {
        items: messagesWithChildren || [],
        pagination: parentLevelMessages!.pagination,
      },
      error: null,
    };
  }

  async getChildren(
    parentId: string,
    pagination: Partial<IPaginationParams> = {}
  ) {
    return super.getAll({
      query: [
        { value: parentId, operator: EQueryOperator.Eq, column: "parentId" },
      ],
      ...pagination,
    });
  }

  async create<U extends Partial<Omit<IMessage, "id" | "updatedAt">>>(data: U) {
    return validateMessageCreate(data, (data) => super.create(data));
  }

  async update<U extends Partial<IMessage>>(id: string, data: U) {
    return validateMessageUpdate(data, (data) => super.update(id, data));
  }
}

export default MessageService;
