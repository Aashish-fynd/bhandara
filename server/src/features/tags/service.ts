import { IPaginationParams, ITag } from "@/definitions/types";
import Base, { BaseQueryArgs } from "../Base";
import { validateTagCreate, validateTagUpdate } from "./validation";
import { TAG_TABLE_NAME, TAG_EVENT_JUNCTION_TABLE_NAME } from "./constants";
import { EQueryOperator } from "@definitions/enums";
import { SecureMethodCache } from "@decorators";
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
import { PostgrestError } from "@supabase/postgrest-js";

class TagService extends Base<ITag> {
  private readonly getCache = getTagCache;
  private readonly setCache = setTagCache;
  private readonly deleteCache = deleteTagCache;

  constructor() {
    super(TAG_TABLE_NAME);
  }

  async getAll(
    args?: BaseQueryArgs<ITag>,
    pagination?: Partial<IPaginationParams>
  ) {
    return super.getAll(args, pagination);
  }

  async getRootTags() {
    return this._supabaseService.executeRpc(
      "get_top_level_tags_with_children",
      {}
    );
  }

  @SecureMethodCache<ITag>({
    cacheGetter: getEventTagsCache,
    cacheSetter: setEventTagsCache,
    cacheDeleter: deleteEventTagsCache,
  })
  async getAllEventTags(eventId: string) {
    const { data: eventTags, error: eventTagsError } =
      await this._supabaseService.querySupabase({
        table: TAG_EVENT_JUNCTION_TABLE_NAME,
        query: [
          { column: "eventId", operator: EQueryOperator.Eq, value: eventId },
        ],
      });

    const { data } = await super.getAll(
      {
        query: [
          {
            column: "id",
            operator: EQueryOperator.In,
            value: eventTags?.map((tag: { tagId: string }) => tag.tagId) || [],
          },
        ],
      },
      { limit: 1000 }
    );

    return {
      data: data.items,
      error: null,
    };
  }

  @SecureMethodCache<ITag>()
  async create<U extends Partial<Omit<ITag, "id" | "updatedAt">>>(data: U) {
    return validateTagCreate(data, (validatedData: U) =>
      super.create(validatedData)
    );
  }

  @SecureMethodCache<ITag>()
  async update<U extends Partial<ITag>>(id: string, data: U) {
    return validateTagUpdate(data, (validatedData: U) =>
      super.update(id, validatedData)
    );
  }

  @SecureMethodCache<ITag>()
  delete(id: string): Promise<{ data: ITag; error: PostgrestError | null }> {
    return super.delete(id);
  }

  async associateTagToEvent(eventId: string, tagId: string) {
    return this._supabaseService.insertIntoDB({
      table: TAG_EVENT_JUNCTION_TABLE_NAME,
      data: {
        eventId,
        tagId,
      },
    });
  }

  async dissociateTagFromEvent(eventId: string, tagId: string) {
    return this._supabaseService.deleteByQuery({
      table: TAG_EVENT_JUNCTION_TABLE_NAME,
      query: [
        { column: "eventId", operator: EQueryOperator.Eq, value: eventId },
        { column: "tagId", operator: EQueryOperator.Eq, value: tagId },
      ],
    });
  }

  @SecureMethodCache<ITag>({
    cacheGetter: getSubTagsCache,
    cacheSetter: setSubTagsCache,
    cacheDeleter: deleteSubTagsCache,
  })
  getSubTags(tagId: string, limit?: number) {
    return this._supabaseService.querySupabase({
      table: TAG_TABLE_NAME,
      query: [
        { column: "parentId", operator: EQueryOperator.Eq, value: tagId },
      ],
      modifyQuery: (qb) => {
        if (limit) {
          qb.limit(limit);
        }
        return qb;
      },
    });
  }
}

export default TagService;
