import { Router } from "express";
import { asyncHandler, sessionParser, userParser } from "@middlewares";
import {
  deleteEvent,
  updateEvent,
  getEventById,
  createEvent,
  getEvents,
  createEventTag,
  deleteEventTag,
} from "@features/events/controller";

const router = Router();

router.use([sessionParser, userParser]);

router.route("/").get(asyncHandler(getEvents)).post(asyncHandler(createEvent));

router
  .route("/:eventId")
  .get(asyncHandler(getEventById))
  .put(asyncHandler(updateEvent))
  .delete(asyncHandler(deleteEvent));

router.post("/:eventId/tags", asyncHandler(createEventTag));
router.delete("/:eventId/tags/:tagId", asyncHandler(deleteEventTag));

export default router;
