import { Router } from "express";
import {
  asyncHandler,
  sessionParser,
  userParser,
  validateParams,
} from "@middlewares";

import {
  deleteEvent,
  updateEvent,
  getEventById,
  createEvent,
  getEvents,
  createEventTag,
  deleteEventTag,
  eventJoinLeaveHandler,
  verifyEvent,
  associateEventMedia,
  deleteEventMedia,
  getEventThreads,
} from "@features/events/controller";
const router = Router();

router.use([sessionParser, userParser]);

router.route("/").get(asyncHandler(getEvents)).post(asyncHandler(createEvent));

router
  .route("/:eventId")
  .get([validateParams(["eventId"])], asyncHandler(getEventById))
  .put([validateParams(["eventId"])], asyncHandler(updateEvent))
  .delete([validateParams(["eventId"])], asyncHandler(deleteEvent));

router.post(
  "/:eventId/tags/:tagId/associate",
  [validateParams(["eventId", "tagId"])],
  asyncHandler(createEventTag)
);

router.delete(
  "/:eventId/tags/:tagId",
  [validateParams(["eventId", "tagId"])],
  asyncHandler(deleteEventTag)
);

router.get(
  "/:eventId/threads",
  [validateParams(["eventId"])],
  asyncHandler(getEventThreads)
);

router.post("/:eventId/verify", asyncHandler(verifyEvent));
router.get(
  "/:eventId/:action",
  [validateParams(["eventId", "action"])],
  asyncHandler(eventJoinLeaveHandler)
);

router.get(
  "/:eventId/media/:mediaId/associate",
  [validateParams(["eventId", "mediaId"])],
  asyncHandler(associateEventMedia)
);

router.delete(
  "/:eventId/media/:mediaId",
  [validateParams(["eventId", "mediaId"])],
  asyncHandler(deleteEventMedia)
);

export default router;
