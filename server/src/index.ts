import createServer from "@app";
import config from "@config";
import logger from "@logger";
import { initializeSocket } from "@socket";
import { initializeMediaRealtime } from "@supabase/realtime";
import http from "http";

const app = createServer();

const httpServer = http.createServer(app);
initializeSocket(httpServer);
initializeMediaRealtime();

httpServer.listen(config.port, () => {
  logger.info(`Server is running on port ${config.port}`);
});
