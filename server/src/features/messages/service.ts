import {
  IMessage,
  IMessageContent,
  IPaginationParams,
} from "@/definitions/types";
import Base, { BaseQueryArgs } from "../Base";
import { EQueryOperator } from "@/definitions/enums";
import { validateMessageCreate, validateMessageUpdate } from "./validation";
import { MESSAGE_TABLE_NAME } from "./constants";
import MediaService from "@features/media/service";
import { isEmpty } from "@utils";
import UserService from "@features/users/service";

class MessageService extends Base<IMessage> {
  private readonly mediaService: MediaService;
  private readonly userService: UserService;

  constructor() {
    super(MESSAGE_TABLE_NAME);
    this.mediaService = new MediaService();
    this.userService = new UserService();
  }

  async getAll(
    args: BaseQueryArgs<IMessage> = {},
    pagination: Partial<IPaginationParams> = {}
  ) {
    args.query?.push({
      value: null,
      operator: EQueryOperator.Is,
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
    const childMessagesPromises = (parentLevelMessages?.items || [])?.map(
      async (m) => {
        const mediaIds = [...((m.content as any)?.media || [])];

        const mediaData = await this.mediaService.getMediaByIds(mediaIds);

        if ("media" in m.content) {
          m.content.media = (m.content.media as string[]).map((media) => {
            return mediaData.data[media];
          });
        }

        return this.getChildren(m.threadId, m.id, { limit: 1 });
      }
    );

    const childMessages = await Promise.all(childMessagesPromises);

    const parentMessageWithPopulatedUsers =
      await this.userService.getAndPopulateUserProfiles(
        parentLevelMessages?.items || [],
        "userId",
        "user"
      );

    // Using the same index ensures each child is matched with its correct parent
    const messagesWithChildren = parentMessageWithPopulatedUsers?.map(
      (parent, index) => ({
        ...parent,
        children: childMessages[index].data,
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
    threadId: string,
    parentId: string,
    pagination: Partial<IPaginationParams>
  ) {
    const { data } = await super.getAll(
      {
        query: [
          { value: threadId, operator: EQueryOperator.Eq, column: "threadId" },
          { value: parentId, operator: EQueryOperator.Eq, column: "parentId" },
        ],
      },
      pagination
    );
    if (!isEmpty(data.items)) {
      const mediaIds = data.items
        .map((m) => {
          if ("media" in m.content) {
            return (m.content as any)?.media;
          }
          return [];
        })
        .flat();

      const { data: mediaData } = await this.mediaService.getMediaByIds(
        mediaIds
      );

      data.items.forEach((m) => {
        if ("media" in m.content) {
          m.content.media = (m.content.media as string[]).map(
            (media) => mediaData[media]
          );
        }
      });

      const userPopulatedMessages =
        await this.userService.getAndPopulateUserProfiles(
          data.items,
          "userId",
          "user"
        );

      return {
        data: { items: userPopulatedMessages, pagination: data.pagination },
      };
    }

    return { data };
  }

  async create<U extends Partial<Omit<IMessage, "id" | "updatedAt">>>(data: U) {
    return validateMessageCreate(data, (data) => super.create(data));
  }

  async update<U extends Partial<IMessage>>(id: string, data: U) {
    return validateMessageUpdate(data, (data) => super.update(id, data));
  }

  getById(id: string) {
    return super.getById(id);
  }
}

export default MessageService;
