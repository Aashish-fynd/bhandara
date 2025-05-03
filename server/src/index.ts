import createServer from "@app";
import config from "@config";

const app = createServer();

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});
