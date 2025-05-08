import createServer from "@app";
import config from "@config";
import logger from "@logger";

const app = createServer();

app.listen(config.port, () => {
  logger.info(`Server is running on port ${config.port}`);
});
