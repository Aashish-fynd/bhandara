import {
  IMessage,
  IMessageContent,
  IPaginationParams,
} from "@/definitions/types";
import {
  createRecord,
  deleteRecord,
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
import { Thread } from "@features/threads/model";

class MessageService {
  private readonly mediaService: MediaService;
  private readonly userService: UserService;
  private readonly reactionService: ReactionService;

  private readonly populateFields = ["user", "thread", "reactions", "media"];

  constructor() {
    this.mediaService = new MediaService();
    this.userService = new UserService();
    this.reactionService = new ReactionService();
  }

  private async populateMessage(message: IMessage, fields: string[]) {
    const promises: Record<string, Promise<any>> = {};

    fields.forEach((field) => {
      switch (field) {
        case "user":
          promises.user = this.userService.getById(message.userId);
          break;
        case "thread":
          promises.thread = Thread.findByPk(message.threadId, { raw: true });
          break;
        case "reactions":
          promises.reactions = this.reactionService.getReactions(
            `messages/${message.id}`
          );
          break;
        case "media":
          if ("media" in message.content) {
            const ids = (message.content.media as string[]) || [];
            promises.media = this.mediaService
              .getMediaByIds(ids)
              .then((res) => res.data);
          }
          break;
      }
    });

    const results = await Promise.allSettled(Object.values(promises));
    const resolved: Record<string, any> = {};
    Object.keys(promises).forEach((key, idx) => {
      const r = results[idx];
      resolved[key] = r.status === "fulfilled" ? r.value : null;
    });

    if (fields.includes("user")) message.user = resolved.user?.data || null;
    if (fields.includes("thread")) (message as any).thread = resolved.thread?.data || null;
    if (fields.includes("reactions")) message.reactions = resolved.reactions?.data || [];
    if (fields.includes("media") && resolved.media) {
      message.content = {
        ...message.content,
        media: (message.content.media as string[]).map(
          (id) => resolved.media[id]
        ),
      } as IMessageContent;
    }

    return message;
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

  async create<U extends Partial<Omit<IMessage, "id" | "updatedAt">>>(data: U, populate?: boolean | string[]) {
    const result = await validateMessageCreate(data, async (validData) => {
      if (validData.parentId) {
        const parent = await this.getById(validData.parentId);
        if (!parent.data) throw new BadRequestError("Parent message not found");
        if (parent.data.parentId)
          throw new BadRequestError(
            "Nested messages beyond one level are not allowed"
          );
      }
      return createRecord(Message, validData);
    });
    if (populate && result.data) {
      const { data: populated } = await this.getById(result.data.id, populate);
      return { data: populated, error: result.error };
    }
    return result;
  }

  async update<U extends Partial<IMessage>>(id: string, data: U, populate?: boolean | string[]) {
    const result = await validateMessageUpdate(data, async (validData) => {
      if (validData.parentId) {
        const parent = await this.getById(validData.parentId);
        if (!parent.data) throw new BadRequestError("Parent message not found");
        if (parent.data.parentId)
          throw new BadRequestError(
            "Nested messages beyond one level are not allowed"
          );
      }
      return updateRecord(Message, id, validData);
    });
    if (populate && !result.error) {
      const { data: populated } = await this.getById(id, populate);
      return { data: populated, error: result.error };
    }
    return result;
  }

  async getById(id: string, populate?: boolean | string[]) {
    const result = await findById(Message, id);
    const data = result.data;
    if (populate && data) {
      const fields =
        populate === true
          ? this.populateFields
          : this.populateFields.filter((f) => (populate as string[]).includes(f));
      const populated = await this.populateMessage(data as IMessage, fields);
      return { data: populated, error: result.error };
    }
    return result;
  }

  async delete(id: string) {
    return deleteRecord(Message, id);
  }
}

export default MessageService;
