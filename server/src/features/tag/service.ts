import { IPaginationParams, ITag } from "@/definitions/types";
import Base from "../Base";
import { validateTagCreate, validateTagUpdate } from "./validation";
import { TAG_TABLE_NAME, TAG_EVENT_JUNCTION_TABLE_NAME } from "./constants";
import { EQueryOperator } from "@definitions/enums";

class TagService extends Base<ITag> {
  constructor() {
    super(TAG_TABLE_NAME);
  }

  async getAllEventTags(
    eventId: string,
    pagination: Partial<IPaginationParams> = {}
  ) {
    const { data: eventTags, error: eventTagsError } =
      await this._supabaseService.querySupabase({
        table: TAG_EVENT_JUNCTION_TABLE_NAME,
        query: [
          { column: "eventId", operator: EQueryOperator.Eq, value: eventId },
        ],
      });

    if (eventTagsError) return { error: eventTagsError };

    const { data, error } = await super.getAll(
      {
        modifyQuery: (qb) =>
          qb.in("id", eventTags?.map((tag) => tag.tagId) || []),
      },
      pagination
    );

    if (error) return { error };

    const formattedData = (data?.items || []).map((item) => ({
      eventId: item.eventId,
      ...item,
    }));

    return {
      data: {
        items: formattedData,
        pagination: data!.pagination,
      },
      error,
    };
  }

  async create<U extends Partial<Omit<ITag, "id" | "updatedAt">>>(data: U) {
    return validateTagCreate(data, (validatedData: U) =>
      super.create(validatedData)
    );
  }

  async update<U extends Partial<ITag>>(id: string, data: U) {
    return validateTagUpdate(data, (validatedData: U) =>
      super.update(id, validatedData)
    );
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

  async dissociateTagFromEvent(junctionId: string) {
    return this._supabaseService.deleteById({
      table: TAG_EVENT_JUNCTION_TABLE_NAME,
      id: junctionId,
    });
  }
}

export default TagService;
