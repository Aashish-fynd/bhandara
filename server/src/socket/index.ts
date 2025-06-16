import { Namespace, Server, Socket } from "socket.io";
import config from "@config";
import logger from "@logger";
import { requestContextMiddleware, socketUserParser } from "@middlewares";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { IncomingMessage } from "http";
import { IBaseUser } from "@definitions/types";
import { PLATFORM_SOCKET_EVENTS } from "@constants";
import http from "http";
import { MessageService, ThreadService } from "@features";
import { NotFoundError } from "@exceptions";
import { isEmpty } from "@utils";

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
          if (message.data) {
            (message.data as any).thread = threadResponse.data;
            (message.data as any).user = socket.request.user;
          }
          socket.emit(PLATFORM_SOCKET_EVENTS.MESSAGE_CREATED, message);
        } catch (error) {
          logger.error(`Error sending new message`, error);
          cb?.({ error: error || { message: "Something went wrong" } });
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

      socket.on(PLATFORM_SOCKET_EVENTS.DISCONNECT, async () => {});
    }
  );

  return io;
}

export const getPlatformNamespace = () => platformNamespace;

export const emitSocketEvent = (
  event: string,
  payload: { data?: any; error?: any }
) => {
  if (!platformNamespace) return;
  platformNamespace.emit(event, payload);
};
