import { Router } from "express";
import {
  asyncHandler,
  sessionParser,
  userParser,
  validateParams,
  paginationParser,
} from "@middlewares";
import {
  createEvent,
  deleteEvent,
  deleteEventMedia,
  deleteEventTag,
  eventJoinLeaveHandler,
  getEventById,
  getEventThreads,
  getEvents,
  updateEvent,
  verifyEvent,
} from "@features/events/controller";
import {
  createThread,
  deleteThread,
  getThread,
  updateThread,
} from "@features/threads/controller";
import {
  createMessage,
  deleteMessage,
  getChildMessages,
  getMessageById,
  getMessages,
  updateMessage,
} from "@features/messages/controller";
import ReactionService from "@features/reactions/service";
import { ICustomRequest } from "@definitions/types";
import { NotFoundError } from "@exceptions";

const router = Router({ mergeParams: true });
const reactionService = new ReactionService();

router.use([sessionParser, userParser]);

router.route("/")
  .get(asyncHandler(getEvents))
  .post(asyncHandler(createEvent));

router.route("/:eventId")
  .get([validateParams(["eventId"])], asyncHandler(getEventById))
  .put([validateParams(["eventId"])], asyncHandler(updateEvent))
  .delete([validateParams(["eventId"])], asyncHandler(deleteEvent));

router.delete(
  "/:eventId/tags/:tagId",
  [validateParams(["eventId", "tagId"])],
  asyncHandler(deleteEventTag)
);

router.post(
  "/:eventId/verify",
  [validateParams(["eventId"])],
  asyncHandler(verifyEvent)
);

router.get(
  "/:eventId/:action",
  [validateParams(["eventId", "action"])],
  asyncHandler(eventJoinLeaveHandler)
);

router.delete(
  "/:eventId/media/:mediaId",
  [validateParams(["eventId", "mediaId"])],
  asyncHandler(deleteEventMedia)
);

// Threads
router.route("/:eventId/threads")
  .get(
    [validateParams(["eventId"]), paginationParser],
    asyncHandler(getEventThreads)
  )
  .post(
    [validateParams(["eventId"])],
    asyncHandler((req, res, next) => {
      req.body.eventId = req.params.eventId;
      return createThread(req, res, next);
    })
  );

router.route("/:eventId/threads/:threadId")
  .get([validateParams(["eventId", "threadId"])], asyncHandler(getThread))
  .put([validateParams(["eventId", "threadId"])], asyncHandler(updateThread))
  .delete([validateParams(["eventId", "threadId"])], asyncHandler(deleteThread));

router
  .route("/:eventId/threads/:threadId/messages")
  .get(
    [validateParams(["eventId", "threadId"]), paginationParser],
    asyncHandler(getMessages)
  )
  .post(
    [validateParams(["eventId", "threadId"])],
    asyncHandler((req, res, next) => {
      req.body.threadId = req.params.threadId;
      return createMessage(req, res, next);
    })
  );

router.route("/:eventId/threads/:threadId/messages/:messageId")
  .get(
    [validateParams(["eventId", "threadId", "messageId"])],
    asyncHandler(getMessageById)
  )
  .put(
    [validateParams(["eventId", "threadId", "messageId"])],
    asyncHandler(updateMessage)
  )
  .delete(
    [validateParams(["eventId", "threadId", "messageId"])],
    asyncHandler(deleteMessage)
  );

router.get(
  "/:eventId/threads/:threadId/child-messages/:parentId",
  [validateParams(["eventId", "threadId", "parentId"]), paginationParser],
  asyncHandler(getChildMessages)
);

// Reactions for events
router.get(
  "/:eventId/reactions",
  [validateParams(["eventId"])],
  asyncHandler(async (req: ICustomRequest, res) => {
    const reactions = await reactionService.getReactions(`events/${req.params.eventId}`, req.query.userId as string | undefined);
    res.status(200).json({ data: reactions, error: null });
  })
);

router.post(
  "/:eventId/reactions",
  [validateParams(["eventId"])],
  asyncHandler(async (req: ICustomRequest, res) => {
    const reaction = await reactionService.create({
      contentId: `events/${req.params.eventId}`,
      emoji: req.body.emoji,
      userId: req.user.id,
    });
    res.status(201).json({ data: reaction, error: null });
  })
);

router
  .route("/:eventId/reactions/:reactionId")
  .put(
    [validateParams(["eventId", "reactionId"])],
    asyncHandler(async (req: ICustomRequest, res) => {
      const updated = await reactionService.update(req.params.reactionId, req.body);
      res.status(200).json({ data: updated, error: null });
    })
  )
  .delete(
    [validateParams(["eventId", "reactionId"])],
    asyncHandler(async (req: ICustomRequest, res) => {
      const deleted = await reactionService.delete(req.params.reactionId);
      if (!deleted) throw new NotFoundError("Reaction not found");
      res.status(200).json({ data: deleted, error: null });
    })
  );

// Reactions for threads
router.get(
  "/:eventId/threads/:threadId/reactions",
  [validateParams(["eventId", "threadId"])],
  asyncHandler(async (req: ICustomRequest, res) => {
    const reactions = await reactionService.getReactions(`threads/${req.params.threadId}`, req.query.userId as string | undefined);
    res.status(200).json({ data: reactions, error: null });
  })
);

router.post(
  "/:eventId/threads/:threadId/reactions",
  [validateParams(["eventId", "threadId"])],
  asyncHandler(async (req: ICustomRequest, res) => {
    const reaction = await reactionService.create({
      contentId: `threads/${req.params.threadId}`,
      emoji: req.body.emoji,
      userId: req.user.id,
    });
    res.status(201).json({ data: reaction, error: null });
  })
);

router
  .route("/:eventId/threads/:threadId/reactions/:reactionId")
  .put(
    [validateParams(["eventId", "threadId", "reactionId"])],
    asyncHandler(async (req: ICustomRequest, res) => {
      const updated = await reactionService.update(req.params.reactionId, req.body);
      res.status(200).json({ data: updated, error: null });
    })
  )
  .delete(
    [validateParams(["eventId", "threadId", "reactionId"])],
    asyncHandler(async (req: ICustomRequest, res) => {
      const deleted = await reactionService.delete(req.params.reactionId);
      if (!deleted) throw new NotFoundError("Reaction not found");
      res.status(200).json({ data: deleted, error: null });
    })
  );

// Reactions for messages
router.get(
  "/:eventId/threads/:threadId/messages/:messageId/reactions",
  [validateParams(["eventId", "threadId", "messageId"])],
  asyncHandler(async (req: ICustomRequest, res) => {
    const reactions = await reactionService.getReactions(`messages/${req.params.messageId}`, req.query.userId as string | undefined);
    res.status(200).json({ data: reactions, error: null });
  })
);

router.post(
  "/:eventId/threads/:threadId/messages/:messageId/reactions",
  [validateParams(["eventId", "threadId", "messageId"])],
  asyncHandler(async (req: ICustomRequest, res) => {
    const reaction = await reactionService.create({
      contentId: `messages/${req.params.messageId}`,
      emoji: req.body.emoji,
      userId: req.user.id,
    });
    res.status(201).json({ data: reaction, error: null });
  })
);

router
  .route("/:eventId/threads/:threadId/messages/:messageId/reactions/:reactionId")
  .put(
    [validateParams(["eventId", "threadId", "messageId", "reactionId"])],
    asyncHandler(async (req: ICustomRequest, res) => {
      const updated = await reactionService.update(req.params.reactionId, req.body);
      res.status(200).json({ data: updated, error: null });
    })
  )
  .delete(
    [validateParams(["eventId", "threadId", "messageId", "reactionId"])],
    asyncHandler(async (req: ICustomRequest, res) => {
      const deleted = await reactionService.delete(req.params.reactionId);
      if (!deleted) throw new NotFoundError("Reaction not found");
      res.status(200).json({ data: deleted, error: null });
    })
  );

export default router;
