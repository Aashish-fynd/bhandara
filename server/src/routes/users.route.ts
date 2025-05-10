import { EQueryOperator } from "@definitions/enums";
import { ICustomRequest, IRequestPagination } from "@definitions/types";
import { NotFoundError } from "@exceptions";
import { getSafeUser, UserService } from "@features";
import {
  asyncHandler,
  paginationParser,
  sessionParser,
  userParser,
} from "@middlewares";
import { isEmpty, omit } from "@utils";
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

      const { data } = await userService.getAll({ query }, req.pagination);

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
      const { data } = await userService.getById(id);
      if (isEmpty(data)) throw new NotFoundError("User not found");
      return res.status(200).json({ data: getSafeUser(data), error: null });
    })
  )
  .delete(
    asyncHandler(async (req: ICustomRequest, res: Response) => {
      const { id } = req.params;
      const { data } = await userService.delete(id);
      return res.status(200).json({ data: getSafeUser(data), error: null });
    })
  )
  .patch(
    asyncHandler(async (req: ICustomRequest, res: Response) => {
      const { id } = req.params;
      const updateBody = omit(req.body, ["password", "email"]);
      const { data } = await userService.update(id, updateBody);
      return res.status(200).json({ data: getSafeUser(data), error: null });
    })
  );

export default router;
