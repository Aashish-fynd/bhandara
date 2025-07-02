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
    const res = await validateReactionCreate(data, (validData) =>
      createRecord(Reaction, validData)
    );
    return res;
  }

  async update<U extends Partial<IReaction>>(id: string, data: U) {
    const res = await validateReactionUpdate(data, (validData) =>
      updateRecord(Reaction, { id }, validData)
    );
    return res;
  }

  delete(id: string, skipGet = false) {
    return deleteRecord(Reaction, { id }, skipGet);
  }

  async getReactions(contentId: string, userId?: string) {
    const where: any = { contentId };
    if (userId) where.userId = userId;
    const data = await findAllWithPagination(Reaction, where, {
      limit: 1000,
    });
    let reactions = data.items || [];
    if (!isEmpty(reactions)) {
      reactions = await this.userService.getAndPopulateUserProfiles({
        data: reactions,
        searchKey: "userId",
        populateKey: "user",
      });
    }
    return reactions;
  }

  async deleteByQuery(where: Partial<IReaction>) {
    const matchingRows = await Reaction.findAll({ where });
    const deletedRow = await Reaction.destroy({ where });
    logger.debug(`Deleted reaction rows: ${deletedRow}`);
    return matchingRows;
  }
}

export default ReactionService;
