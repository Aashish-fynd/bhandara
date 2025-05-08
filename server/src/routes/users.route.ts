import { EQueryOperator } from "@definitions/enums";
import { ICustomRequest, IRequestPagination } from "@definitions/types";
import { getSafeUser, RedisCache, UserService } from "@features";
import {
  asyncHandler,
  paginationParser,
  sessionParser,
  userParser,
} from "@middlewares";
import { omit } from "@utils";
import { Response, Router } from "express";

const router = Router();
const userService = new UserService();

router.use([sessionParser, userParser]);

router.get(
  "/",
  paginationParser,
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

router
  .route("/:id")
  .get(
    asyncHandler(async (req: ICustomRequest, res: Response) => {
      const { id } = req.params;
      const { data, error } = await userService.getById(id);
      if (error) throw new Error(error.message);
      return res.status(200).json({ data: getSafeUser(data), error: null });
    })
  )
  .delete(
    asyncHandler(async (req: ICustomRequest, res: Response) => {
      const { id } = req.params;
      const { data, error } = await userService.delete(id);
      if (error) throw new Error(error.message);
      return res.status(200).json({ data, error: null });
    })
  )
  .patch(
    asyncHandler(async (req: ICustomRequest, res: Response) => {
      const { id } = req.params;
      const updateBody = omit(req.body, ["password", "email"]);
      const { data, error } = await userService.update(id, updateBody);
      if (error) throw new Error(error.message);
      return res.status(200).json({ data, error: null });
    })
  );

export default router;
