import { IEvent, IPaginationParams, ITag } from "@/definitions/types";
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

  @MethodCacheSync({})
  async getById(id: string) {
    return findById(Tag, id);
  }

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
    const res = await validateTagCreate(data, (validatedData: U) =>
      createRecord(Tag, validatedData)
    );
    return res;
  }

  @MethodCacheSync<ITag>()
  async update<U extends Partial<ITag>>(id: string, data: U) {
    const res = await validateTagUpdate(data, (validatedData: U) =>
      updateRecord(Tag, { id }, validatedData)
    );
    return res;
  }

  @MethodCacheSync<ITag>()
  delete(id: string) {
    return deleteRecord(Tag, { id });
  }

  @MethodCacheSync<ITag>({})
  async associateTagToEvent(eventId: string, tagId: string) {
    const event = await findById(Event, eventId);
    if (!event) return null;
    const tags = new Set((event.tags || []) as string[]);
    tags.add(tagId);
    const data = await updateRecord(
      Event,
      { id: eventId },
      { tags: Array.from(tags) }
    );
    return data;
  }

  async dissociateTagFromEvent(eventId: string, tagId: string) {
    await deleteEventTagsCache(eventId);
    const event = await findById(Event, eventId);
    if (!event) return null;
    const tags = (event.tags || []) as string[];
    const data = await updateRecord(
      Event,
      { id: eventId },
      {
        tags: tags.filter((t) => t !== tagId),
      }
    );
    return data;
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
