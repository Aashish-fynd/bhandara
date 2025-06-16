import createServer from "@app";
import config from "@config";
import logger from "@logger";
import { initializeSocket } from "@socket";
import http from "http";

const app = createServer();

const httpServer = http.createServer(app);
initializeSocket(httpServer);

httpServer.listen(config.port, () => {
  logger.info(`Server is running on port ${config.port}`);
});
