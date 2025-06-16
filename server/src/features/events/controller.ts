import { ICustomRequest, IRequestPagination } from "@definitions/types";
import { Response } from "express";
import EventService from "./service";
import { BadRequestError, NotFoundError } from "@exceptions";
import { isEmpty } from "@utils";
import TagService from "@features/tags/service";
import { emitSocketEvent } from "@socket/emitter";
import { PLATFORM_SOCKET_EVENTS } from "@constants";

const eventService = new EventService();
const tagService = new TagService();

export const getEvents = async (
  req: ICustomRequest & IRequestPagination,
  res: Response
) => {
  const events = await eventService.getAll({}, req.pagination);
  return res.status(200).json(events);
};

export const getEventById = async (req: ICustomRequest, res: Response) => {
  const { eventId } = req.params;

  const event = await eventService.getById(eventId, true);

  if (isEmpty(event)) throw new NotFoundError("Event not found");

  return res.status(200).json(event);
};

export const createEvent = async (req: ICustomRequest, res: Response) => {
  const event = await eventService.createEvent(
    {
      body: req.body,
      tagIds: req.body.tagIds || req.body.tags || [],
      mediaIds: req.body.mediaIds || req.body.media || []
    },
    true
  );
  emitSocketEvent(PLATFORM_SOCKET_EVENTS.EVENT_CREATED, event);
  return res.status(201).json(event);
};

export const updateEvent = async (req: ICustomRequest, res: Response) => {
  const event = await eventService.update(req.params.id, req.body, true);
  emitSocketEvent(PLATFORM_SOCKET_EVENTS.EVENT_UPDATED, {
    data: { id: req.params.id, ...req.body },
    error: null
  });
  return res.status(200).json(event);
};

export const deleteEvent = async (req: ICustomRequest, res: Response) => {
  const event = await eventService.delete(req.params.id);

  if (isEmpty(event)) throw new NotFoundError("Event not found");

  emitSocketEvent(PLATFORM_SOCKET_EVENTS.EVENT_DELETED, {
    data: { id: req.params.id },
    error: null
  });

  return res.status(200).json(event);
};

export const createEventTag = async (req: ICustomRequest, res: Response) => {
  const { eventId, tagId } = req.params;

  const tag = await tagService.associateTagToEvent(eventId, tagId);
  return res.status(201).json(tag);
};

export const deleteEventTag = async (req: ICustomRequest, res: Response) => {
  const { eventId, tagId } = req.params;

  const tag = await tagService.dissociateTagFromEvent(eventId, tagId);
  return res.status(200).json(tag);
};

export const eventJoinLeaveHandler = async (
  req: ICustomRequest,
  res: Response
) => {
  const event = await eventService.joinLeaveEvent(
    req.user.id,
    req.params.eventId,
    req.params.action as "join" | "leave"
  );
  return res.status(200).json(event);
};

export const verifyEvent = async (req: ICustomRequest, res: Response) => {
  const { currentCoordinates } = req.body;

  if (isEmpty(currentCoordinates))
    throw new BadRequestError("Current coordinates are required");

  const event = await eventService.verifyEvent(
    req.user.id,
    req.params.eventId,
    currentCoordinates
  );
  return res.status(200).json(event);
};

export const associateEventMedia = async (
  req: ICustomRequest,
  res: Response
) => {
  const { eventId, mediaId } = req.params;

  const event = await eventService.associateMediaToEvent(eventId, mediaId);
  return res.status(200).json(event);
};

export const deleteEventMedia = async (req: ICustomRequest, res: Response) => {
  const { eventId, mediaId } = req.params;

  const event = await eventService.deleteEventMedia(eventId, mediaId);
  return res.status(200).json(event);
};
