import { findAllWithPagination } from "@utils/dbUtils";
import { validateTagCreate, validateTagUpdate } from "./validation";
import { Tag } from "./model";
import { Event } from "../events/model";
import { getTagCache, setTagCache, deleteTagCache, getEventTagsCache, setEventTagsCache, deleteEventTagsCache, getSubTagsCache, setSubTagsCache, } from "./helpers";
import { NotFoundError } from "@exceptions";
class TagService {
    getCache = getTagCache;
    setCache = setTagCache;
    deleteCache = deleteTagCache;
    constructor() { }
    async getById(id) {
        const cached = await this.getCache(id);
        if (cached)
            return cached;
        const res = await Tag.findByPk(id, { raw: true });
        if (res)
            await this.setCache(id, res);
        return res;
    }
    async getAll(where = {}, pagination, select) {
        return findAllWithPagination(Tag, where, pagination, select);
    }
    async _getByIdNoCache(id) {
        const res = await Tag.findByPk(id, { raw: true });
        return res;
    }
    async getRootTags() {
        const [results] = await Tag.sequelize.query(`SELECT t.*, COUNT(c.id) > 0 AS "hasChildren" FROM "Tags" t
       LEFT JOIN "Tags" c ON c."parentId" = t."id" AND c."deletedAt" IS NULL
       WHERE t."deletedAt" IS NULL AND t."parentId" IS NULL
       GROUP BY t."id";`);
        return results;
    }
    async getAllEventTags(event) {
        const cacheKey = event?.id;
        if (cacheKey) {
            const cached = await getEventTagsCache(cacheKey);
            if (cached)
                return cached;
        }
        const tagIds = event?.tags || [];
        if (!tagIds.length)
            return [];
        const data = await findAllWithPagination(Tag, { id: tagIds }, { limit: tagIds.length });
        const items = data.items;
        if (cacheKey && items) {
            await setEventTagsCache(cacheKey, items);
        }
        return items;
    }
    async create(data) {
        const res = await validateTagCreate(data, async (validatedData) => {
            const row = await Tag.create(validatedData);
            return row.toJSON();
        });
        const created = res;
        if (created) {
            await this.setCache(created.id, created);
        }
        return res;
    }
    async update(id, data) {
        const res = await validateTagUpdate(data, async (validatedData) => {
            const row = await Tag.findByPk(id);
            if (!row)
                throw new Error("Tag not found");
            await row.update(validatedData);
            return row.toJSON();
        });
        await this.deleteCache(id);
        return res;
    }
    async delete(id) {
        const row = await Tag.findByPk(id);
        if (!row)
            return null;
        await row.destroy();
        await this.deleteCache(id);
        return row.toJSON();
    }
    async dissociateTag(eventId, tagId) {
        const event = await Event.findByPk(eventId);
        if (!event)
            throw new NotFoundError("Event not found");
        const tags = new Set((event.tags || []));
        if (!tags.has(tagId))
            throw new NotFoundError("Tag not found");
        tags.delete(tagId);
        await event.update({ tags: Array.from(tags) });
        await deleteEventTagsCache(eventId);
        return true;
    }
    async getSubTags(tagId, limit) {
        const cached = await getSubTagsCache(tagId);
        if (cached)
            return cached;
        const res = await findAllWithPagination(Tag, { parentId: tagId }, limit ? { limit } : {});
        if (res.items)
            await setSubTagsCache(tagId, res.items);
        return res;
    }
}
export default TagService;
//# sourceMappingURL=service.js.map