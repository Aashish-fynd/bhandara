import config from "@config";
import { RequestContext } from "@contexts";
import { ICustomRequest } from "@definitions/types";
import { UnauthorizedError } from "@exceptions";
import { getUserSessionCache } from "@features";
import { NextFunction, Request, Response } from "express";

const sessionParser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const jwtCookie = req.cookies?.[config.cookie.keyName];

  if (!Boolean(jwtCookie))
    throw new UnauthorizedError(`Missing or invalid token`);

  const session = await getUserSessionCache(jwtCookie);

  if (!session)
    throw new UnauthorizedError(`Session not found, please login again`);

  (req as ICustomRequest).session = session;
  RequestContext.setContextValue("session", {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
  });

  return next();
};

export default sessionParser;
