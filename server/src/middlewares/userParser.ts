import { ICustomRequest } from "@definitions/types";
import { UnauthorizedError } from "@exceptions";
import { getJWTPayload } from "@helpers";
import { NextFunction, Request, Response } from "express";
import asyncHandler from "./asyncHandler";
import { RedisCache, UserService } from "@features";
import config from "@config";

const redis = new RedisCache({ namespace: "users" });
const userService = new UserService();

const userParser = async (req: Request, res: Response, next: NextFunction) => {
  const jwtCookie = req.cookies?.[config.cookie.keyName];

  const unauthorizedError = new UnauthorizedError(`Missing or invalid token`);
  if (!Boolean(jwtCookie)) throw unauthorizedError;

  try {
    // get session and parse jwt token too
    const { _id } = (await getJWTPayload(jwtCookie)) || {};
    const user = await redis.getItem(`user:${_id}`);
    if (!user) {
      const { data, error } = await userService.getById(_id);
      if (!data || error) throw unauthorizedError;
      await redis.setItem(`user:${_id}`, data);
    }

    (req as ICustomRequest).user = user;
  } catch (error) {
    throw unauthorizedError;
  }

  return next();
};

export default asyncHandler(userParser);
