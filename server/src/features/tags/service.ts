import { IPaginationParams, ITag } from "@/definitions/types";
import {
  createRecord,
  deleteRecord,
  findAllWithPagination,
  findById,
  updateRecord,
} from "@utils/dbUtils";
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

  async getAll(
    where: Record<string, any> = {},
    pagination?: Partial<IPaginationParams>,
    select?: string
  ) {
    return findAllWithPagination(Tag, where, pagination, select);
  }

  async _getByIdNoCache(id: string) {
    return findById(Tag, id);
  }

  async getRootTags() {
    const [results] = await Tag.sequelize!.query(
      `SELECT t.*, COUNT(c.id) > 0 AS "hasChildren" FROM "Tags" t
       LEFT JOIN "Tags" c ON c."parentId" = t."id" AND c."deletedAt" IS NULL
       WHERE t."deletedAt" IS NULL AND t."parentId" IS NULL
       GROUP BY t."id";`
    );
    return { data: results as any, error: null };
  }

  @MethodCacheSync<ITag>({
    cacheGetter: getEventTagsCache,
    cacheSetter: setEventTagsCache,
    cacheDeleter: deleteEventTagsCache,
  })
  async getAllEventTags(eventId: string) {
    const { data: event } = await findById(Event, eventId);

    const tagIds = (event[0]?.tags || []) as string[];

    if (!tagIds.length) return { data: [], error: null };

    const { data } = await findAllWithPagination(
      Tag,
      { id: tagIds },
      { limit: tagIds.length }
    );

    return { data: data.items, error: null };
  }

  @MethodCacheSync<ITag>()
  async create<U extends Partial<Omit<ITag, "id" | "updatedAt">>>(data: U) {
    return validateTagCreate(data, (validatedData: U) =>
      createRecord(Tag, validatedData)
    );
  }

  @MethodCacheSync<ITag>()
  async update<U extends Partial<ITag>>(id: string, data: U) {
    return validateTagUpdate(data, (validatedData: U) =>
      updateRecord(Tag, id, validatedData)
    );
  }

  @MethodCacheSync<ITag>()
  delete(id: string) {
    return deleteRecord(Tag, id);
  }

  @MethodCacheSync<ITag>({})
  async associateTagToEvent(eventId: string, tagId: string) {
    const { data: event } = await findById(Event, eventId);
    if (!event[0]) return { data: null, error: null };
    const tags = new Set((event[0].tags || []) as string[]);
    tags.add(tagId);
    return updateRecord(Event, eventId, { tags: Array.from(tags) });
  }

  async dissociateTagFromEvent(eventId: string, tagId: string) {
    await deleteEventTagsCache(eventId);
    const { data: event } = await findById(Event, eventId);
    if (!event[0]) return { data: null, error: null };
    const tags = (event[0].tags || []) as string[];
    return updateRecord(Event, eventId, {
      tags: tags.filter((t) => t !== tagId),
    });
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
