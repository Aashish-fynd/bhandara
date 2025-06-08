import {
  asyncHandler,
  paginationParser,
  sessionParser,
  userParser,
} from "@middlewares";
import { Router } from "express";
import {
  getAllUser,
  getUserById,
  deleteUser,
  updateUser,
  getUserByQuery,
  getUserInterests,
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

router.get("/:id/interests", asyncHandler(getUserInterests));

export default router;
