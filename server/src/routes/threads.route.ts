import { Router } from "express";
import {
  asyncHandler,
  paginationParser,
  sessionParser,
  userParser,
} from "@middlewares";

import {
  getMessages,
  createMessage,
  getMessageById,
  updateMessage,
  deleteMessage,
  getChildMessages,
} from "@features/messages/controller";
import {
  createThread,
  deleteThread,
  getThread,
  getThreads,
  updateThread,
} from "@features/threads/controller";

const router = Router();

router.use([sessionParser, userParser]);

router.get("/", [paginationParser], asyncHandler(getThreads));
router.post("/", asyncHandler(createThread));
router
  .route("/:threadId")
  .get(asyncHandler(getThread))
  .put(asyncHandler(updateThread))
  .delete(asyncHandler(deleteThread));

router.get(
  "/:threadId/messages",
  [paginationParser],
  asyncHandler(getMessages)
);
router.post("/:threadId/messages", asyncHandler(createMessage));
router
  .route("/:threadId/messages/:messageId")
  .get(asyncHandler(getMessageById))
  .put(asyncHandler(updateMessage))
  .delete(asyncHandler(deleteMessage));

router.get(
  "/:threadId/child-messages/:parentId",
  [paginationParser],
  asyncHandler(getChildMessages)
);

export default router;
