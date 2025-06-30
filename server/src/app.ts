import cors from "cors";
import express from "express";
import cookieparser from "cookie-parser";
import swaggerUI from "swagger-ui-express";

import helmet from "helmet";
import config from "@config";
import {
  errorHandler,
  morganLogger,
  requestContextMiddleware,
} from "@middlewares";
import appRoutes from "@routes";
import { NotFoundError } from "@exceptions";
import { swaggerSpec } from "@docs/swagger";

const createServer = () => {
  const app = express();

  // cors setup to allow requests from the frontend only for now
  app.use(cors(config.corsOptions));
  app.use(helmet());

  // parse requests of content-type - application/json
  app.use(express.json({ limit: config.express.fileSizeLimit }));
  // parse requests of content-type - application/x-www-form-urlencoded
  app.use(
    express.urlencoded({
      extended: true,
      limit: config.express.fileSizeLimit,
    })
  );

  app.use(morganLogger);
  app.use(cookieparser());

  // routes setup

  // swagger docs
  app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerSpec));

  app.get("/", (req, res) => {
    res.send({
      name: "Bhandara API",
      description: "Bhandara backend service",
      version: "1.0.0",
    });
  });

  app.use(requestContextMiddleware);

  app.use("/api", appRoutes);

  app.use((req, res, next) => {
    next(new NotFoundError(`path not found: ${req.originalUrl}`));
  });

  app.use(errorHandler);

  return app;
};

export default createServer;
