import {
  IMessage,
  IMessageContent,
  IPaginationParams,
} from "@/definitions/types";
import {
  createRecord,
  findAllWithPagination,
  findById,
  updateRecord,
} from "@utils/dbUtils";
import { validateMessageCreate, validateMessageUpdate } from "./validation";
import { Message } from "./model";
import MediaService from "@features/media/service";
import { isEmpty } from "@utils";
import UserService from "@features/users/service";
import { BadRequestError } from "@exceptions";
import ReactionService from "@features/reactions/service";

class MessageService {
  private readonly mediaService: MediaService;
  private readonly userService: UserService;
  private readonly reactionService: ReactionService;

  constructor() {
    this.mediaService = new MediaService();
    this.userService = new UserService();
    this.reactionService = new ReactionService();
  }

  async getAll(
    where: Record<string, any> = {},
    pagination: Partial<IPaginationParams> = {}
  ) {
    const { data: parentLevelMessages, error } = await findAllWithPagination(
      Message,
      { ...where, parentId: null },
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

        const [children, reactions] = await Promise.all([
          this.getChildren(m.threadId, m.id, { limit: 1 }),
          this.reactionService.getReactions(`messages/${m.id}`),
        ]);
        m.reactions = reactions.data;
        return children;
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
    const { data } = await findAllWithPagination(
      Message,
      { threadId, parentId },
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

      const reactionPromises = userPopulatedMessages.map((msg) =>
        this.reactionService.getReactions(`messages/${msg.id}`)
      );
      const reactionResults = await Promise.all(reactionPromises);
      userPopulatedMessages.forEach((msg, idx) => {
        msg.reactions = reactionResults[idx].data;
      });

      return {
        data: { items: userPopulatedMessages, pagination: data.pagination },
      };
    }

    return { data };
  }

  async create<U extends Partial<Omit<IMessage, "id" | "updatedAt">>>(data: U) {
    return validateMessageCreate(data, async (validData) => {
      if (validData.parentId) {
        const parent = await this.getById(validData.parentId);
        if (!parent.data) throw new BadRequestError("Parent message not found");
        if (parent.data.parentId)
          throw new BadRequestError("Nested messages beyond one level are not allowed");
      }
      return createRecord(Message, validData);
    });
  }

  async update<U extends Partial<IMessage>>(id: string, data: U) {
    return validateMessageUpdate(data, async (validData) => {
      if (validData.parentId) {
        const parent = await this.getById(validData.parentId);
        if (!parent.data) throw new BadRequestError("Parent message not found");
        if (parent.data.parentId)
          throw new BadRequestError("Nested messages beyond one level are not allowed");
      }
      return updateRecord(Message, id, validData);
    });
  }

  getById(id: string) {
    return findById(Message, id);
  }
}

export default MessageService;
