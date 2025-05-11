import { ICustomRequest, IRequestPagination } from "@definitions/types";
import { Response } from "express";
import ThreadsService from "./service";
import { NotFoundError } from "@exceptions";
import { isEmpty, pick } from "@utils";

const threadsService = new ThreadsService();

export const getThreads = async (
  req: ICustomRequest & IRequestPagination,
  res: Response
) => {
  const threads = await threadsService.getAll({}, req.pagination);
  return res.status(200).json(threads);
};

export const createThread = async (req: ICustomRequest, res: Response) => {
  const thread = await threadsService.create(req.body);
  return res.status(201).json(thread);
};

export const getThread = async (req: ICustomRequest, res: Response) => {
  const { threadId } = req.params;
  const { includeMessages } = req.query;
  const thread = await threadsService.getById(
    threadId,
    includeMessages === "true"
  );

  if (isEmpty(thread.data)) {
    throw new NotFoundError("Thread not found");
  }

  return res.status(200).json(thread);
};

export const updateThread = async (req: ICustomRequest, res: Response) => {
  const { threadId } = req.params;
  const thread = await threadsService.update(threadId, req.body);
  return res.status(200).json(thread);
};

export const deleteThread = async (req: ICustomRequest, res: Response) => {
  const { threadId } = req.params;
  const thread = await threadsService.delete(threadId);
  return res.status(200).json(thread);
};
