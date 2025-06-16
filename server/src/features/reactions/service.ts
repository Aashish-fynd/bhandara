import { IReaction, IPaginationParams } from "@/definitions/types";
import {
  createRecord,
  deleteRecord,
  findAllWithPagination,
  findById,
  updateRecord,
} from "@utils/dbUtils";
import { Reaction } from "./model";
import { validateReactionCreate, validateReactionUpdate } from "./validation";
import { MethodCacheSync } from "@decorators";
import {
  deleteReactionCache,
  getReactionCache,
  setReactionCache,
} from "./helpers";

class ReactionService {
  private readonly getCache = getReactionCache;
  private readonly setCache = setReactionCache;
  private readonly deleteCache = deleteReactionCache;

  @MethodCacheSync<IReaction>()
  async getById(id: string) {
    return findById(Reaction, id);
  }

  async getAll(
    where: Record<string, any> = {},
    pagination?: Partial<IPaginationParams>,
    select?: string
  ) {
    return findAllWithPagination(Reaction, where, pagination, select);
  }

  @MethodCacheSync<IReaction>()
  async create<U extends Partial<Omit<IReaction, "id" | "updatedAt">>>(
    data: U
  ) {
    return validateReactionCreate(data, (validData) =>
      createRecord(Reaction, validData)
    );
  }

  @MethodCacheSync<IReaction>()
  async update<U extends Partial<IReaction>>(id: string, data: U) {
    return validateReactionUpdate(data, (validData) =>
      updateRecord(Reaction, id, validData)
    );
  }

  @MethodCacheSync<IReaction>()
  delete(id: string) {
    return deleteRecord(Reaction, id);
  }

  @MethodCacheSync<IReaction[]>({})
  async getReactions(contentId: string) {
    const { data } = await findAllWithPagination(
      Reaction,
      { contentId },
      { limit: 1000 }
    );
    return { data: data.items || [], error: null };
  }
}

export default ReactionService;
