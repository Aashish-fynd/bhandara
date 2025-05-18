import {
  asyncHandler,
  paginationParser,
  sessionParser,
  userParser,
  validateParams,
} from "@middlewares";
import { Router } from "express";
import {
  getAllUser,
  getUserById,
  deleteUser,
  updateUser,
  getUserByQuery,
} from "@features/users/controller";

const router = Router();

router.get("/query", asyncHandler(getUserByQuery));

router.use([sessionParser, userParser]);

router.get("/", paginationParser, asyncHandler(getAllUser));

router
  .route("/:id")
  .get(asyncHandler(getUserById))
  .delete(asyncHandler(deleteUser))
  .patch(asyncHandler(updateUser));

export default router;
