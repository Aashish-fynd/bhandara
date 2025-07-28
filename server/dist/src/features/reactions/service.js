import { findAllWithPagination } from "@utils/dbUtils";
import { Reaction } from "./model";
import { validateReactionCreate, validateReactionUpdate } from "./validation";
import UserService from "@features/users/service";
import { isEmpty } from "@utils";
import logger from "@logger";
class ReactionService {
    userService;
    constructor() {
        this.userService = new UserService();
    }
    async getById(id) {
        const res = await Reaction.findByPk(id, { raw: true });
        return res;
    }
    async getAll(where = {}, pagination, select) {
        return findAllWithPagination(Reaction, where, pagination, select);
    }
    async create(data) {
        const res = await validateReactionCreate(data, async (validData) => {
            const row = await Reaction.create(validData);
            return row.toJSON();
        });
        return res;
    }
    async update(id, data) {
        const res = await validateReactionUpdate(data, async (validData) => {
            const row = await Reaction.findByPk(id);
            if (!row)
                throw new Error("Reaction not found");
            await row.update(validData);
            return row.toJSON();
        });
        return res;
    }
    async delete(id, skipGet = false) {
        if (skipGet) {
            return Reaction.destroy({ where: { id } });
        }
        const row = await Reaction.findByPk(id);
        if (!row)
            return null;
        await row.destroy();
        return row.toJSON();
    }
    async getReactions(contentId, userId) {
        const where = { contentId };
        if (userId)
            where.userId = userId;
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
    async deleteByQuery(where) {
        const matchingRows = await Reaction.findAll({ where });
        const deletedRow = await Reaction.destroy({ where });
        logger.debug(`Deleted reaction rows: ${deletedRow}`);
        return matchingRows;
    }
}
export default ReactionService;
//# sourceMappingURL=service.js.map