import { Namespace, Server, Socket } from "socket.io";
import config from "@config";
import logger from "@logger";
import { requestContextMiddleware, socketUserParser } from "@middlewares";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { IncomingMessage } from "http";
import { IBaseUser } from "@definitions/types";
import { PLATFORM_SOCKET_EVENTS } from "@constants";
import http from "http";
import {
  EventService,
  getSafeUser,
  MediaService,
  MessageService,
  ReactionService,
  ThreadService,
} from "@features";
import { BadRequestError, NotFoundError } from "@exceptions";
import { isEmpty } from "@utils";
import { setPlatformNamespace, emitSocketEvent } from "./emitter";
import { EAllowedReactionTables } from "@features/reactions/constants";
import { EAccessLevel, EThreadType } from "@definitions/enums";

interface CustomSocket
  extends Socket<
    DefaultEventsMap,
    DefaultEventsMap,
    DefaultEventsMap,
    IBaseUser
  > {
  request: IncomingMessage & {
    user: IBaseUser;
  };
}

const rooms = new Set();

let platformNamespace: Namespace;

const messageService = new MessageService();
const threadService = new ThreadService();
const mediaService = new MediaService();
const reactionService = new ReactionService();
const eventService = new EventService();

const createJoinRoom = (socket: CustomSocket, room: string) => {
  socket.join(room);
  rooms.add(room);
};

const removeRoom = (room: string) => {
  rooms.delete(room);
};

export function initializeSocket(server: http.Server) {
  const io = new Server(server, { cors: { ...config.corsOptions } });

  platformNamespace = io.of("/platform");
  setPlatformNamespace(platformNamespace);
  platformNamespace.use((socket, next) =>
    requestContextMiddleware(socket.request as any, null, next as any)
  );
  platformNamespace.use(socketUserParser);

  platformNamespace.on(
    PLATFORM_SOCKET_EVENTS.CONNECT,
    async (socket: CustomSocket) => {
      logger.info(`Connected ${socket.id}`);
      const socketUserId = socket.request.user.id;

      socket.on(PLATFORM_SOCKET_EVENTS.MESSAGE_CREATED, async (request, cb) => {
        try {
          const messageData = request || {};
          const threadResponse = await threadService.getById(
            messageData.threadId
          );
          if (isEmpty(threadResponse.data))
            throw new NotFoundError("Thread not found");

          const message = await messageService.create(messageData);
          const media = (message.data.content?.media || []) as string[];

          if (!isEmpty(media)) {
            const mediaData = await mediaService.getMediaByIds(media);
            const populatedMedia = media.map((i) => mediaData.data[i]);
            message.data.content.media = populatedMedia;
          }

          if (message.data) {
            (message.data as any).thread = threadResponse.data;
            (message.data as any).user = socket.request.user;
          }
          emitSocketEvent(PLATFORM_SOCKET_EVENTS.MESSAGE_CREATED, message);
          cb({ data: true });
        } catch (error) {
          logger.error(`Error sending new message`, error);
          cb?.({
            error: error?.message || "Something went wrong",
            stack: error,
          });
        }
      });

      socket.on(PLATFORM_SOCKET_EVENTS.MESSAGE_UPDATED, async (request, cb) => {
        try {
        } catch (error) {
          logger.error(`Error updating message`, error);
          cb?.({ error: error?.message || "Something went wrong" });
        }
      });

      socket.on(PLATFORM_SOCKET_EVENTS.MESSAGE_DELETED, async (request, cb) => {
        logger.debug(`User ${socketUserId} chat window opened`);
        const { conversation: conversationId } = request || {};

        if (!conversationId)
          return cb?.({ error: "Conversation id is required" });
      });

      socket.on(
        PLATFORM_SOCKET_EVENTS.REACTION_CREATED,
        async (request, cb) => {
          try {
            const { contentId, contentPath, reaction, parentId } = request;

            if (!Object.values(EAllowedReactionTables).includes(contentPath)) {
              throw new BadRequestError(
                `Invalid content path provided. Provided:${contentPath}`
              );
            }

            const serviceMap = {
              [EAllowedReactionTables.Message]: messageService,
              [EAllowedReactionTables.Event]: eventService,
              [EAllowedReactionTables.Thread]: threadService,
            };

            const reactionContentId = `${contentPath}/${contentId}`;

            // delete previous reaction from current user on that content
            const responses = await Promise.all([
              serviceMap[contentPath].getById(contentId),
              reactionService.deleteByQuery({
                contentId: reactionContentId,
                userId: socketUserId,
              }),
            ]);

            if (isEmpty(responses[0].data))
              throw new NotFoundError(`Reaction or Thread not found`);

            responses.forEach((f) => {
              if (f.error) throw f.error;
            });

            const creationData = {
              contentId: reactionContentId,
              emoji: reaction,
              userId: socketUserId,
            };

            const { data: newReaction, error: newReactionError } =
              await reactionService.create(creationData);

            if (newReactionError) throw newReactionError;

            newReaction.user = getSafeUser(socket.request.user);

            emitSocketEvent(PLATFORM_SOCKET_EVENTS.REACTION_CREATED, {
              data: {
                id: contentId,
                contentPath,
                reaction: newReaction,
                parentId,
              },
            });

            cb?.({ data: true });
          } catch (error) {
            logger.error(`Error sending new message`, error);
            cb?.({
              error: error?.message || "Something went wrong",
              stack: error,
            });
          }
        }
      );
      socket.on(
        PLATFORM_SOCKET_EVENTS.REACTION_UPDATED,
        async (request, cb) => {
          try {
            const { contentId, contentPath, reaction, parentId } = request;

            if (typeof reaction !== "string")
              throw new BadRequestError(`Reaction should be string`);

            if (!Object.values(EAllowedReactionTables).includes(contentPath)) {
              throw new BadRequestError(
                `Invalid content path provided. Provided:${contentPath}`
              );
            }

            const serviceMap = {
              [EAllowedReactionTables.Message]: messageService,
              [EAllowedReactionTables.Event]: eventService,
              [EAllowedReactionTables.Thread]: threadService,
            };

            const reactionContentId = `${contentPath}/${contentId}`;

            // delete previous reaction from current user on that content
            const responses = await Promise.all([
              serviceMap[contentPath].getById(contentId),
              reactionService.getReactions(reactionContentId),
            ]);

            const content = responses[0]?.data;

            if (!content)
              throw new NotFoundError(
                `Content not found with provided id:${contentId}`
              );

            const previousReaction = responses[1]?.data?.[0];

            if (!previousReaction)
              throw new NotFoundError(
                `Reaction not found ${reaction} for user`
              );

            const { data: updatedReaction, error: newReactionError } =
              await reactionService.update(previousReaction.id, {
                emoji: reaction,
              });

            if (newReactionError) throw newReactionError;

            updatedReaction.user = getSafeUser(socket.request.user);

            emitSocketEvent(PLATFORM_SOCKET_EVENTS.REACTION_UPDATED, {
              data: {
                id: contentId,
                contentPath,
                reaction: updatedReaction,
                parentId,
              },
            });

            cb?.({ data: true });
          } catch (error) {
            logger.error(`Error sending new message`, error);
            cb?.({
              error: error?.message || "Something went wrong",
              stack: error,
            });
          }
        }
      );
      socket.on(
        PLATFORM_SOCKET_EVENTS.REACTION_DELETED,
        async (request, cb) => {
          try {
            const { contentId, contentPath, id, reaction, parentId } = request;

            if (typeof reaction !== "string")
              throw new BadRequestError(`Reaction should be string`);

            if (!Object.values(EAllowedReactionTables).includes(contentPath)) {
              throw new BadRequestError(
                `Invalid content path provided. Provided:${contentPath}`
              );
            }

            const serviceMap = {
              [EAllowedReactionTables.Message]: messageService,
              [EAllowedReactionTables.Event]: eventService,
              [EAllowedReactionTables.Thread]: threadService,
            };

            const reactionContentId = `${contentPath}/${contentId}`;

            // delete previous reaction from current user on that content
            const responses = await Promise.all([
              serviceMap[contentPath].getById(contentId),
              reactionService.getReactions(reactionContentId),
            ]);

            const content = responses[0]?.data;

            if (!content)
              throw new NotFoundError(
                `Content not found with provided id:${contentId}`
              );

            const previousReaction = responses[1]?.data?.[0];

            if (!previousReaction)
              throw new NotFoundError(
                `Reaction not found ${reaction} for user`
              );

            const { data: deletedReaction, error: newReactionError } =
              await reactionService.delete(previousReaction.id, true);

            if (newReactionError) throw newReactionError;

            emitSocketEvent(PLATFORM_SOCKET_EVENTS.REACTION_DELETED, {
              data: {
                id: contentId,
                contentPath,
                reaction: previousReaction,
                parentId,
              },
            });

            cb?.({ data: true });
          } catch (error) {
            logger.error(`Error sending new message`, error);
            cb?.({
              error: error?.message || "Something went wrong",
              stack: error,
            });
          }
        }
      );

      socket.on(PLATFORM_SOCKET_EVENTS.THREAD_CREATED, async (request, cb) => {
        try {
          const { eventId, ...messageData } = request || {};

          if (!eventId)
            throw new BadRequestError(`EventId is required for new thread`);

          const eventResponse = await eventService.getById(eventId);

          if (isEmpty(eventResponse.data))
            throw new NotFoundError("Event not found");

          const newThread = await threadService.create({
            eventId,
            type: EThreadType.Discussion,
            createdBy: socketUserId,
            visibility: EAccessLevel.Public,
          });

          if (isEmpty(newThread.data))
            throw new Error("Unable able to create thread");

          messageData.threadId = newThread.data.id;

          const message = await messageService.create(messageData);
          const media = (message.data.content?.media || []) as string[];

          if (!isEmpty(media)) {
            const mediaData = await mediaService.getMediaByIds(media);
            const populatedMedia = media.map((i) => mediaData.data[i]);
            message.data.content.media = populatedMedia;
          }

          if (message.data) {
            (message.data as any).thread = eventResponse.data;
            (message.data as any).user = socket.request.user;
          }

          newThread.data.messages = [message.data];
          newThread.data.creator = socket.request.user;

          emitSocketEvent(PLATFORM_SOCKET_EVENTS.THREAD_CREATED, {
            data: { ...newThread.data, event: eventResponse.data },
            error: null,
          });
          cb({ data: true });
        } catch (error) {
          logger.error(`Error sending new message`, error);
          cb?.({
            error: error?.message || "Something went wrong",
            stack: error,
          });
        }
      });

      socket.on(PLATFORM_SOCKET_EVENTS.DISCONNECT, async () => {});
    }
  );

  return io;
}

export const getPlatformNamespace = () => platformNamespace;
