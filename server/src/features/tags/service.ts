import { IPaginationParams, ITag } from "@/definitions/types";
import Base, { BaseQueryArgs } from "../Base";
import { validateTagCreate, validateTagUpdate } from "./validation";
import { TAG_TABLE_NAME } from "./constants";
import { Tag } from "./model";
import { Event } from "../events/model";
import { EQueryOperator } from "@definitions/enums";
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

class TagService extends Base<ITag> {
  private readonly getCache = getTagCache;
  private readonly setCache = setTagCache;
  private readonly deleteCache = deleteTagCache;

  constructor() {
    super(Tag);
  }

  async getAll(
    args?: BaseQueryArgs<ITag>,
    pagination?: Partial<IPaginationParams>
  ) {
    return super.getAll(args, pagination);
  }

  async _getByIdNoCache(id: string) {
    return super.getById(id);
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
    const { data: event } = await this._dbService.query(Event, {
      query: [
        { column: "id", operator: EQueryOperator.Eq, value: eventId },
      ],
    });

    const tagIds = (event[0]?.tags || []) as string[];

    if (!tagIds.length) return { data: [], error: null };

    const { data } = await super.getAll(
      {
        query: [{ column: "id", operator: EQueryOperator.In, value: tagIds }],
      },
      { limit: tagIds.length }
    );

    return { data: data.items, error: null };
  }

  @MethodCacheSync<ITag>()
  async create<U extends Partial<Omit<ITag, "id" | "updatedAt">>>(data: U) {
    return validateTagCreate(data, (validatedData: U) =>
      super.create(validatedData)
    );
  }

  @MethodCacheSync<ITag>()
  async update<U extends Partial<ITag>>(id: string, data: U) {
    return validateTagUpdate(data, (validatedData: U) =>
      super.update(id, validatedData)
    );
  }

  @MethodCacheSync<ITag>()
  delete(id: string) {
    return super.delete(id);
  }

  @MethodCacheSync<ITag>({})
  async associateTagToEvent(eventId: string, tagId: string) {
    const { data: event } = await this._dbService.query(Event, {
      query: [{ column: "id", operator: EQueryOperator.Eq, value: eventId }],
    });
    if (!event[0]) return { data: null, error: null };
    const tags = new Set((event[0].tags || []) as string[]);
    tags.add(tagId);
    return this._dbService.updateById(Event, eventId, { tags: Array.from(tags) });
  }

  async dissociateTagFromEvent(eventId: string, tagId: string) {
    await deleteEventTagsCache(eventId);
    const { data: event } = await this._dbService.query(Event, {
      query: [{ column: "id", operator: EQueryOperator.Eq, value: eventId }],
    });
    if (!event[0]) return { data: null, error: null };
    const tags = (event[0].tags || []) as string[];
    return this._dbService.updateById(Event, eventId, {
      tags: tags.filter((t) => t !== tagId),
    });
  }

  @MethodCacheSync<ITag>({
    cacheGetter: getSubTagsCache,
    cacheSetter: setSubTagsCache,
    cacheDeleter: deleteSubTagsCache,
  })
  getSubTags(tagId: string, limit?: number) {
    return this._dbService.query(Tag, {
      query: [{ column: "parentId", operator: EQueryOperator.Eq, value: tagId }],
      modifyOptions: (opts) => {
        if (limit) opts.limit = limit;
        return opts;
      },
    });
  }
}

export default TagService;
