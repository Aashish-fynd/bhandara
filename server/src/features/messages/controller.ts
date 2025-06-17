import { Response } from "express";
import MessageService from "./service";
import { ICustomRequest, IRequestPagination } from "@definitions/types";
import { EQueryOperator } from "@definitions/enums";
import { cleanQueryObject, isEmpty, pick } from "@utils";
import { NotFoundError } from "@exceptions";
import { emitSocketEvent } from "@socket/emitter";
import { PLATFORM_SOCKET_EVENTS } from "@constants";

const messagesService = new MessageService();

export const getMessages = async (
  req: ICustomRequest & IRequestPagination,
  res: Response
) => {
  const { threadId } = req.params;
  const { userId, parentId } = req.query;

  const _queryObject = { userId, parentId, threadId };

  const messages = await messagesService.getAll(
    cleanQueryObject(_queryObject),
    req.pagination
  );
  return res.status(200).json(messages);
};

export const createMessage = async (req: ICustomRequest, res: Response) => {
  const { threadId } = req.params;
  const message = await messagesService.create(
    pick({ ...req.body, threadId, isEdited: true }, [
      "userId",
      "content",
      "parentId",
      "threadId",
      "isEdited",
    ]),
    true
  );
  emitSocketEvent(PLATFORM_SOCKET_EVENTS.MESSAGE_CREATED, message);
  return res.status(200).json(message);
};

export const updateMessage = async (req: ICustomRequest, res: Response) => {
  const { messageId } = req.params;
  const message = await messagesService.update(
    messageId,
    pick({ ...req.body, isEdited: true }, ["content", "isEdited"]),
    true
  );
  emitSocketEvent(PLATFORM_SOCKET_EVENTS.MESSAGE_UPDATED, {
    data: { id: messageId, ...req.body },
    error: null
  });
  return res.status(200).json(message);
};

export const deleteMessage = async (req: ICustomRequest, res: Response) => {
  const { messageId } = req.params;
  const message = await messagesService.delete(messageId);
  emitSocketEvent(PLATFORM_SOCKET_EVENTS.MESSAGE_DELETED, {
    data: { id: messageId },
    error: null
  });
  return res.status(200).json(message);
};

export const getMessageById = async (req: ICustomRequest, res: Response) => {
  const { messageId } = req.params;
  const message = await messagesService.getById(messageId, true);
  if (isEmpty(message.data)) throw new NotFoundError("Message not found");

  return res.status(200).json(message);
};

export const getChildMessages = async (
  req: ICustomRequest & IRequestPagination,
  res: Response
) => {
  const { parentId, threadId } = req.params;
  const messages = await messagesService.getChildren(
    threadId,
    parentId,
    req.pagination
  );
  return res.status(200).json(messages);
};
