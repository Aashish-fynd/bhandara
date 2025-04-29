import { IPaginationParams, ITag } from "@/definitions/types/global";
import Base from "../Base";
import { validateTagCreate, validateTagUpdate } from "./validation";
import { TAG_TABLE_NAME, TAG_EVENT_JUNCTION_TABLE_NAME } from "./constants";

class TagService extends Base<ITag> {
  constructor() {
    super(TAG_TABLE_NAME);
  }

  async getAllEventTags(eventId: string, pagination: Partial<IPaginationParams> = {}) {
    const { data: eventTags, error: eventTagsError } = await this.supabaseClient
      .from(TAG_EVENT_JUNCTION_TABLE_NAME)
      .select("tagId")
      .eq("eventId", eventId);

    if (eventTagsError) return { error: eventTagsError };

    const { data, error } = await super.getAll(
      {
        modifyQuery: (qb) => qb.in("id", eventTags?.map((tag) => tag.tagId) || [])
      },
      pagination
    );

    if (error) return { error };

    const formattedData = (data?.items || []).map((item) => ({
      eventId: item.eventId,
      ...item
    }));

    return {
      data: {
        items: formattedData,
        pagination: data!.pagination
      },
      error
    };
  }

  async create<U extends Partial<Omit<ITag, "id" | "updatedAt">>>(data: U) {
    return validateTagCreate(data, (validatedData: U) => super.create(validatedData));
  }

  async update<U extends Partial<ITag>>(id: string, data: U) {
    return validateTagUpdate(data, (validatedData: U) => super.update(id, validatedData));
  }

  async associateTagToEvent(eventId: string, tagId: string) {
    return this.supabaseClient.from(TAG_EVENT_JUNCTION_TABLE_NAME).insert({
      eventId,
      tagId
    });
  }

  async dissociateTagFromEvent(junctionId: string) {
    return this.supabaseClient.from(TAG_EVENT_JUNCTION_TABLE_NAME).delete().eq("id", junctionId);
  }
}

export default TagService;
