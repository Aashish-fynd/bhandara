import { findAllWithPagination } from "@utils/dbUtils";
import { validateMessageCreate, validateMessageUpdate } from "./validation";
import { Message } from "./model";
import MediaService from "@features/media/service";
import { isEmpty } from "@utils";
import UserService from "@features/users/service";
import { BadRequestError } from "@exceptions";
import ReactionService from "@features/reactions/service";
// Note: Thread data is intentionally not populated here to avoid
// circular dependencies between services. Controllers should fetch
// thread details separately when needed.
class MessageService {
    mediaService;
    userService;
    reactionService;
    populateFields = ["user", "reactions", "media"];
    constructor() {
        this.mediaService = new MediaService();
        this.userService = new UserService();
        this.reactionService = new ReactionService();
    }
    async populateMessage(message, fields) {
        const promises = {};
        fields.forEach((field) => {
            switch (field) {
                case "user":
                    promises.user = this.userService.getById(message.userId);
                    break;
                case "reactions":
                    promises.reactions = this.reactionService.getReactions(`messages/${message.id}`);
                    break;
                case "media":
                    if ("media" in message.content) {
                        const ids = message.content.media || [];
                        promises.media = this.mediaService.getMediaByIds(ids);
                    }
                    break;
            }
        });
        const results = await Promise.allSettled(Object.values(promises));
        const resolved = {};
        Object.keys(promises).forEach((key, idx) => {
            const r = results[idx];
            resolved[key] = r.status === "fulfilled" ? r.value : null;
        });
        if (fields.includes("user"))
            message.user = resolved.user?.data || null;
        if (fields.includes("reactions"))
            message.reactions = resolved.reactions?.data || [];
        if (fields.includes("media") && resolved.media) {
            message.content = {
                ...message.content,
                media: message.content.media.map((id) => resolved.media[id]),
            };
        }
        return message;
    }
    async getAll(where = {}, pagination = {}) {
        const { items: parentItems, pagination: parentPagination } = await findAllWithPagination(Message, { ...where, parentId: null }, pagination);
        // Step 2: Fetch total count of parent threads for pagination metadata
        const childMessagesPromises = (parentItems || [])?.map(async (m) => {
            const mediaIds = [...(m.content?.media || [])];
            const mediaData = await this.mediaService.getMediaByIds(mediaIds);
            if ("media" in m.content) {
                m.content.media = m.content.media.map((media) => {
                    return mediaData[media];
                });
            }
            const [children, reactions] = await Promise.all([
                this.getChildren(m.threadId, m.id, { limit: 1 }),
                this.reactionService.getReactions(`messages/${m.id}`),
            ]);
            m.reactions = reactions;
            return children;
        });
        const childMessages = await Promise.all(childMessagesPromises);
        const parentMessageWithPopulatedUsers = await this.userService.getAndPopulateUserProfiles({
            data: parentItems || [],
            searchKey: "userId",
            populateKey: "user",
        });
        // Using the same index ensures each child is matched with its correct parent
        const messagesWithChildren = parentMessageWithPopulatedUsers?.map((parent, index) => ({
            ...parent,
            children: childMessages[index].items,
        }));
        return {
            items: messagesWithChildren || [],
            pagination: parentPagination,
        };
    }
    async getChildren(threadId, parentId, pagination) {
        const data = await findAllWithPagination(Message, { threadId, parentId }, pagination);
        if (!isEmpty(data.items)) {
            const mediaIds = data.items
                .map((m) => {
                if ("media" in m.content) {
                    return m.content?.media;
                }
                return [];
            })
                .flat();
            const mediaData = await this.mediaService.getMediaByIds(mediaIds);
            data.items.forEach((m) => {
                if ("media" in m.content) {
                    m.content.media = m.content.media.map((media) => mediaData[media]);
                }
            });
            const userPopulatedMessages = await this.userService.getAndPopulateUserProfiles({
                data: data.items,
                searchKey: "userId",
                populateKey: "user",
            });
            const reactionPromises = userPopulatedMessages.map((msg) => this.reactionService.getReactions(`messages/${msg.id}`));
            const reactionResults = await Promise.all(reactionPromises);
            userPopulatedMessages.forEach((msg, idx) => {
                msg.reactions = reactionResults[idx];
            });
            return { items: userPopulatedMessages, pagination: data.pagination };
        }
        return data;
    }
    async create(data, populate) {
        const created = await validateMessageCreate(data, async (validData) => {
            if (validData.parentId) {
                const parent = await this.getById(validData.parentId);
                if (!parent)
                    throw new BadRequestError("Parent message not found");
                if (parent.parentId)
                    throw new BadRequestError("Nested messages beyond one level are not allowed");
            }
            const row = await Message.create(validData);
            return row.toJSON();
        });
        let msg = created?.dataValues ||
            created?.[0]?.dataValues ||
            created;
        if (populate && msg) {
            msg = await this.getById(msg.id, populate);
        }
        return msg;
    }
    async update(id, data, populate) {
        const updated = await validateMessageUpdate(data, async (validData) => {
            if (validData.parentId) {
                const parent = await this.getById(validData.parentId);
                if (!parent)
                    throw new BadRequestError("Parent message not found");
                if (parent.parentId)
                    throw new BadRequestError("Nested messages beyond one level are not allowed");
            }
            const [count, rows] = await Message.update(validData, {
                where: { id },
                returning: true,
            });
            if (count === 0)
                throw new Error("Message not found");
            return rows[0];
        });
        let msg = updated?.[0] ?? updated;
        if (populate && msg) {
            msg = await this.getById(id, populate);
        }
        return msg;
    }
    async getById(id, populate) {
        const data = (await Message.findByPk(id, { raw: true }));
        if (populate && data) {
            const fields = populate === true
                ? this.populateFields
                : this.populateFields.filter((f) => populate.includes(f));
            const populated = await this.populateMessage(data, fields);
            return populated;
        }
        return data;
    }
    async delete(id) {
        const row = await Message.findByPk(id);
        if (!row)
            return null;
        await row.destroy();
        return row.toJSON();
    }
}
export default MessageService;
//# sourceMappingURL=service.js.map