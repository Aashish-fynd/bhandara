import { ICustomRequest, IRequestPagination } from "@definitions/types";
import { Response } from "express";
import ThreadsService from "./service";
import { NotFoundError } from "@exceptions";
import { isEmpty } from "@utils";
import MessageService from "@features/messages/service";
import { EQueryOperator, EThreadType } from "@definitions/enums";

const threadsService = new ThreadsService();
const messageService = new MessageService();

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
  const threadData = await threadsService.getById(threadId);

  const thread = threadData.data;
  if (isEmpty(thread)) {
    throw new NotFoundError("Thread not found");
  }

  // parse into boolean or number to get the number of messages to include, default 1 if `includeMessages` is boolean
  const parsedIncludeMessages =
    includeMessages === "true"
      ? 1
      : includeMessages === "false"
      ? 0
      : parseInt(includeMessages as string, 10) || 1;

  if (parsedIncludeMessages) {
    const messages = await messageService.getAll(
      {
        query: [
          { column: "threadId", operator: EQueryOperator.Eq, value: threadId },
        ],
      },
      { limit: parsedIncludeMessages }
    );

    threadData.data.messages = messages.data.items;
  }

  return res.status(200).json({ data: thread, error: null });
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
