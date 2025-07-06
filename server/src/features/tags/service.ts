import { IEvent, IPaginationParams, ITag } from "@/definitions/types";
import { findAllWithPagination } from "@utils/dbUtils";
import { validateTagCreate, validateTagUpdate } from "./validation";
import { Tag } from "./model";
import { Event } from "../events/model";
import { MethodCacheSync } from "@decorators";
import {
  getTagCache,
  setTagCache,
  deleteTagCache,
  getEventTagsCache,
  setEventTagsCache,
  deleteEventTagsCache,
  getSubTagsCache,
  setSubTagsCache,
  deleteSubTagsCache,
} from "./helpers";

class TagService {
  private readonly getCache = getTagCache;
  private readonly setCache = setTagCache;
  private readonly deleteCache = deleteTagCache;

  constructor() {}

  @MethodCacheSync({})
  async getById(id: string) {
    const res = await Tag.findByPk(id, { raw: true });
    return res as any;
  }

  async getAll(
    where: Record<string, any> = {},
    pagination?: Partial<IPaginationParams>,
    select?: string
  ) {
    return findAllWithPagination(Tag, where, pagination, select);
  }

  async _getByIdNoCache(id: string) {
    const res = await Tag.findByPk(id, { raw: true });
    return res as any;
  }

  async getRootTags() {
    const [results] = await Tag.sequelize!.query(
      `SELECT t.*, COUNT(c.id) > 0 AS "hasChildren" FROM "Tags" t
       LEFT JOIN "Tags" c ON c."parentId" = t."id" AND c."deletedAt" IS NULL
       WHERE t."deletedAt" IS NULL AND t."parentId" IS NULL
       GROUP BY t."id";`
    );
    return results as ITag[];
  }

  @MethodCacheSync<ITag>({
    cacheGetter: getEventTagsCache,
    cacheSetter: setEventTagsCache,
    cacheDeleter: deleteEventTagsCache,
    customCacheKey: (event: IEvent) => event.id,
  })
  async getAllEventTags(event?: IEvent) {
    const tagIds = event?.tags || [];

    if (!tagIds.length) return [];

    const data = await findAllWithPagination(
      Tag,
      { id: tagIds },
      { limit: tagIds.length }
    );

    return data.items;
  }

  @MethodCacheSync<ITag>()
  async create<U extends Partial<Omit<ITag, "id" | "updatedAt">>>(data: U) {
    const res = await validateTagCreate(data, async (validatedData: U) => {
      const row = await Tag.create(validatedData as any);
      return row.toJSON() as any;
    });
    return res;
  }

  @MethodCacheSync<ITag>()
  async update<U extends Partial<ITag>>(id: string, data: U) {
    const res = await validateTagUpdate(data, async (validatedData: U) => {
      const [count, rows] = await Tag.update(validatedData as any, {
        where: { id },
        returning: true,
      });
      if (count === 0) throw new Error("Tag not found");
      return rows[0];
    });
    return res;
  }

  @MethodCacheSync<ITag>()
  delete(id: string) {
    return (async () => {
      const row = await Tag.findByPk(id);
      if (!row) return null;
      await row.destroy();
      return row.toJSON() as any;
    })();
  }

  @MethodCacheSync<ITag>({})
  async associateTagToEvent(eventId: string, tagId: string) {
    const event = (await Event.findByPk(eventId, { raw: true })) as any;
    if (!event) return null;
    const tags = new Set((event.tags || []) as string[]);
    tags.add(tagId);
    const [, rows] = await Event.update(
      { tags: Array.from(tags) } as any,
      { where: { id: eventId }, returning: true }
    );
    return rows[0];
  }

  async dissociateTagFromEvent(eventId: string, tagId: string) {
    await deleteEventTagsCache(eventId);
    const event = (await Event.findByPk(eventId, { raw: true })) as any;
    if (!event) return null;
    const tags = (event.tags || []) as string[];
    const [, rows] = await Event.update(
      { tags: tags.filter((t) => t !== tagId) } as any,
      { where: { id: eventId }, returning: true }
    );
    return rows[0];
  }

  @MethodCacheSync<ITag>({
    cacheGetter: getSubTagsCache,
    cacheSetter: setSubTagsCache,
    cacheDeleter: deleteSubTagsCache,
  })
  getSubTags(tagId: string, limit?: number) {
    return findAllWithPagination(
      Tag,
      { parentId: tagId },
      limit ? { limit } : {}
    );
  }
}

export default TagService;
