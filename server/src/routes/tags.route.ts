import { Router } from "express";
import { sessionParser, userParser, asyncHandler } from "@middlewares";
import {
  createTag,
  deleteTag,
  getTagById,
  getTags,
  updateTag,
} from "@features/tags/controller";

const router = Router();

router.use([sessionParser, userParser]);

router.get("/", asyncHandler(getTags));
router.post("/", asyncHandler(createTag));
router
  .route("/:tagId")
  .get(asyncHandler(getTagById))
  .put(asyncHandler(updateTag))
  .delete(asyncHandler(deleteTag));

export default router;
