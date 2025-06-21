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

import UserService from "@features/users/service";
import { isEmpty } from "@utils";
import logger from "@logger";

class ReactionService {
  private readonly userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

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

  async create<U extends Partial<Omit<IReaction, "id" | "updatedAt">>>(
    data: U
  ) {
    return validateReactionCreate(data, (validData) =>
      createRecord(Reaction, validData)
    );
  }

  async update<U extends Partial<IReaction>>(id: string, data: U) {
    return validateReactionUpdate(data, (validData) =>
      updateRecord(Reaction, id, validData)
    );
  }

  delete(id: string, skipGet = false) {
    return deleteRecord(Reaction, id, skipGet);
  }

  async getReactions(contentId: string, userId?: string) {
    const where: any = { contentId };
    if (userId) where.userId = userId;
    const { data, error } = await findAllWithPagination(Reaction, where, {
      limit: 1000,
    });
    if (!isEmpty(data.items)) {
      const populatedData = await this.userService.getAndPopulateUserProfiles({
        data: data.items,
        searchKey: "userId",
        populateKey: "user",
      });

      return { data: populatedData, error: null };
    }
    return { data: data.items || [], error };
  }

  async deleteByQuery(where: Partial<IReaction>) {
    const matchingRows = await Reaction.findAll({ where });
    const deletedRow = await Reaction.destroy({ where });
    logger.debug(`Deleted reaction rows: ${deletedRow}`);
    return { data: matchingRows, error: null };
  }
}

export default ReactionService;
