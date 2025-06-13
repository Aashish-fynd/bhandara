import { IReaction, IPaginationParams } from "@/definitions/types";
import Base, { BaseQueryArgs } from "../Base";
import { Reaction } from "./model";
import {
  validateReactionCreate,
  validateReactionUpdate,
} from "./validation";
import { EQueryOperator } from "@/definitions/enums";
import { MethodCacheSync } from "@decorators";
import {
  deleteReactionCache,
  getReactionCache,
  setReactionCache,
} from "./helpers";

class ReactionService extends Base<IReaction> {
  private readonly getCache = getReactionCache;
  private readonly setCache = setReactionCache;
  private readonly deleteCache = deleteReactionCache;

  constructor() {
    super(Reaction);
  }

  async getAll(
    args?: BaseQueryArgs<IReaction>,
    pagination?: Partial<IPaginationParams>
  ) {
    return super.getAll(args, pagination);
  }

  @MethodCacheSync<IReaction>()
  async create<U extends Partial<Omit<IReaction, "id" | "updatedAt">>>(data: U) {
    return validateReactionCreate(data, (validData) => super.create(validData));
  }

  @MethodCacheSync<IReaction>()
  async update<U extends Partial<IReaction>>(id: string, data: U) {
    return validateReactionUpdate(data, (validData) =>
      super.update(id, validData)
    );
  }

  @MethodCacheSync<IReaction>()
  delete(id: string) {
    return super.delete(id);
  }

  @MethodCacheSync<IReaction[]>({
    cacheGetter: getReactionCache,
    cacheSetter: setReactionCache,
    cacheDeleter: deleteReactionCache,
  })
  async getReactions(contentId: string) {
    const { data } = await super.getAll(
      {
        query: [
          { column: "contentId", operator: EQueryOperator.Eq, value: contentId },
        ],
      },
      { limit: 1000 }
    );
    return { data: data.items || [], error: null };
  }
}

export default ReactionService;
