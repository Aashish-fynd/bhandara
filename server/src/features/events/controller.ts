import { ICustomRequest, IRequestPagination } from "@definitions/types";
import { Response } from "express";
import EventService from "./service";
import { NotFoundError } from "@exceptions";
import { isEmpty } from "@utils";
import TagService from "@features/tags/service";

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
  const event = await eventService.getById(req.params.id);

  if (isEmpty(event)) throw new NotFoundError("Event not found");

  return res.status(200).json(event);
};

export const createEvent = async (req: ICustomRequest, res: Response) => {
  const event = await eventService.create(req.body);
  return res.status(201).json(event);
};

export const updateEvent = async (req: ICustomRequest, res: Response) => {
  const event = await eventService.update(req.params.id, req.body);
  return res.status(200).json(event);
};

export const deleteEvent = async (req: ICustomRequest, res: Response) => {
  const event = await eventService.delete(req.params.id);

  if (isEmpty(event)) throw new NotFoundError("Event not found");

  return res.status(200).json(event);
};

export const createEventTag = async (req: ICustomRequest, res: Response) => {
  const tag = await tagService.associateTagToEvent(req.params.id, req.body);
  return res.status(201).json(tag);
};

export const deleteEventTag = async (req: ICustomRequest, res: Response) => {
  const tag = await tagService.dissociateTagFromEvent(req.params.id);
  return res.status(200).json(tag);
};
