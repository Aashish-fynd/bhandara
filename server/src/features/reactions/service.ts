import { IReaction, IPaginationParams } from "@/definitions/types";
import Base, { BaseQueryArgs } from "../Base";
import { Reaction } from "./model";
import { EQueryOperator } from "@/definitions/enums";

class ReactionService extends Base<IReaction> {
  constructor() {
    super(Reaction);
  }

  async getAll(
    args?: BaseQueryArgs<IReaction>,
    pagination?: Partial<IPaginationParams>
  ) {
    return super.getAll(args, pagination);
  }

  async getReactions(contentId: string) {
    const { data } = await super.getAll(
      { query: [{ column: "contentId", operator: EQueryOperator.Eq, value: contentId }] },
      { limit: 1000 }
    );
    return { data: data.items || [], error: null };
  }
}

export default ReactionService;
