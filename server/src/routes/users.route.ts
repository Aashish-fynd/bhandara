import { EQueryOperator } from "@definitions/enums";
import { ICustomRequest, IRequestPagination } from "@definitions/types";
import { getSafeUser, RedisCache, UserService } from "@features";
import {
  asyncHandler,
  paginationParser,
  sessionParser,
  userParser,
} from "@middlewares";
import { Response, Router } from "express";

const router = Router();
const userService = new UserService();
const cache = new RedisCache({ namespace: "users" });

router.get(
  "/",
  [sessionParser, userParser, paginationParser],
  asyncHandler(
    async (req: IRequestPagination & ICustomRequest, res: Response) => {
      const { self = "false" } = req.query;

      let query = [];
      if (self !== "true") {
        query = [
          { column: "id", operator: EQueryOperator.Neq, value: req.user.id },
        ];
      }

      const { data, error } = await userService.getAll(
        { query },
        req.pagination
      );

      if (error) throw new Error(error.message);

      const safeUsers = data?.items.map((user) => getSafeUser(user));
      return res.status(200).json({
        data: {
          items: safeUsers,
          pagination: data?.pagination,
        },
        error: null,
      });
    }
  )
);

export default router;
